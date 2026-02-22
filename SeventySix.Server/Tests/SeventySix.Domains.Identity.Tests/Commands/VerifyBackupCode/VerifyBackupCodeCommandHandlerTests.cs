// <copyright file="VerifyBackupCodeCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands;

/// <summary>
/// Unit tests for <see cref="VerifyBackupCodeCommandHandler"/>.
/// Tests challenge token validation, valid/invalid backup code verification with per-user lockout.
/// </summary>
/// <remarks>
/// 80/20 Approach: Focuses on handler orchestration (challenge token, consume + lockout).
/// Underlying <see cref="IBackupCodeService"/> is tested independently.
/// </remarks>
public sealed class VerifyBackupCodeCommandHandlerTests
{
	private const long TestUserId = 42;
	private const string TestEmail = "backup@example.com";
	private const string TestValidCode = "ABCD-1234-EFGH";
	private const string TestClientIp = "127.0.0.1";
	private const string TestChallengeToken = "valid-challenge-token";

	private readonly IBackupCodeService BackupCodeService;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly AuthenticationService AuthService;
	private readonly ISecurityAuditService SecurityAuditService;
	private readonly ITrustedDeviceService TrustedDeviceService;
	private readonly IMfaService MfaService;
	private readonly IMfaAttemptTracker AttemptTracker;

	public VerifyBackupCodeCommandHandlerTests()
	{
		BackupCodeService =
			Substitute.For<IBackupCodeService>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		AuthService =
			IdentityMockFactory.CreateAuthenticationService();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
		TrustedDeviceService =
			Substitute.For<ITrustedDeviceService>();
		MfaService =
			Substitute.For<IMfaService>();
		AttemptTracker =
			Substitute.For<IMfaAttemptTracker>();
	}

	[Fact]
	public async Task Handle_ValidChallengeTokenAndBackupCode_ReturnsSuccessAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateActiveUser();

		ConfigureChallengeTokenValidation(success: true);
		ConfigureUserLookupById(user);

		BackupCodeService
			.VerifyAndConsumeCodeAsync(
				TestUserId,
				TestValidCode,
				Arg.Any<CancellationToken>())
			.Returns(true);

		BackupCodeService
			.GetRemainingCountAsync(
				TestUserId,
				Arg.Any<CancellationToken>())
			.Returns(4);

		ConfigureSuccessfulAuthResult(user);

		VerifyBackupCodeCommand command =
			CreateCommand(TestValidCode);

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldNotBeNull();
		AttemptTracker
			.Received(1)
			.ResetAttempts(
				TestUserId,
				MfaAttemptTypes.BackupCode);
		await MfaService
			.Received(1)
			.ConsumeChallengeAsync(
				TestChallengeToken,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task Handle_InvalidChallengeToken_ReturnsErrorAsync()
	{
		// Arrange
		ConfigureChallengeTokenValidation(success: false);

		VerifyBackupCodeCommand command =
			CreateCommand(TestValidCode);

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidChallenge);
	}

	[Fact]
	public async Task Handle_ExpiredChallengeToken_ReturnsErrorAsync()
	{
		// Arrange
		MfaService
			.ValidateChallengeTokenAsync(
				TestChallengeToken,
				Arg.Any<CancellationToken>())
			.Returns(MfaChallengeValidationResult.Failed(
				"Verification challenge has expired",
				MfaErrorCodes.CodeExpired));

		VerifyBackupCodeCommand command =
			CreateCommand(TestValidCode);

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.CodeExpired);
	}

	[Fact]
	public async Task Handle_UsedChallengeToken_ReturnsErrorAsync()
	{
		// Arrange
		MfaService
			.ValidateChallengeTokenAsync(
				TestChallengeToken,
				Arg.Any<CancellationToken>())
			.Returns(MfaChallengeValidationResult.Failed(
				"Challenge has already been used",
				MfaErrorCodes.ChallengeUsed));

		VerifyBackupCodeCommand command =
			CreateCommand(TestValidCode);

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.ChallengeUsed);
	}

	[Fact]
	public async Task Handle_InvalidCode_IncrementsAttemptsAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateActiveUser();

		ConfigureChallengeTokenValidation(success: true);
		ConfigureUserLookupById(user);

		BackupCodeService
			.VerifyAndConsumeCodeAsync(
				TestUserId,
				"invalid-code",
				Arg.Any<CancellationToken>())
			.Returns(false);

		VerifyBackupCodeCommand command =
			CreateCommand("invalid-code");

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidBackupCode);
		AttemptTracker
			.Received(1)
			.RecordFailedAttempt(
				TestUserId,
				MfaAttemptTypes.BackupCode);
	}

	private ApplicationUser CreateActiveUser()
	{
		return new UserBuilder(TimeProvider.System)
			.WithId(TestUserId)
			.WithEmail(TestEmail)
			.Build();
	}

	private void ConfigureChallengeTokenValidation(bool success)
	{
		if (success)
		{
			MfaService
				.ValidateChallengeTokenAsync(
					TestChallengeToken,
					Arg.Any<CancellationToken>())
				.Returns(MfaChallengeValidationResult.Succeeded(TestUserId));
		}
		else
		{
			MfaService
				.ValidateChallengeTokenAsync(
					TestChallengeToken,
					Arg.Any<CancellationToken>())
				.Returns(MfaChallengeValidationResult.Failed(
					"Invalid or expired challenge",
					MfaErrorCodes.InvalidChallenge));
		}
	}

	private void ConfigureUserLookupById(ApplicationUser user)
	{
		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);
	}

	private void ConfigureSuccessfulAuthResult(ApplicationUser user)
	{
		AuthService
			.GenerateAuthResultAsync(
				user,
				TestClientIp,
				false,
				false,
				Arg.Any<CancellationToken>())
			.Returns(AuthResult.Succeeded(
				"access-token",
				"refresh-token",
				TestDates.Future.UtcDateTime,
				TestEmail,
				"Test User",
				requiresPasswordChange: false));
	}

	private static VerifyBackupCodeCommand CreateCommand(string code)
	{
		return new VerifyBackupCodeCommand(
			new VerifyBackupCodeRequest(
				TestChallengeToken,
				code),
			TestClientIp);
	}

	private Task<AuthResult> InvokeHandlerAsync(VerifyBackupCodeCommand command)
	{
		return VerifyBackupCodeCommandHandler.HandleAsync(
			command,
			BackupCodeService,
			UserManager,
			AuthService,
			SecurityAuditService,
			TrustedDeviceService,
			MfaService,
			AttemptTracker,
			CancellationToken.None);
	}
}