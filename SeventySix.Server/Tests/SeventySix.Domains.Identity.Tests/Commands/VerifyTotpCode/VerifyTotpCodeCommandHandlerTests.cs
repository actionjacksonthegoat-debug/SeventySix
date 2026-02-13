// <copyright file="VerifyTotpCodeCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using Shouldly;

namespace SeventySix.Identity.Tests.Commands;

/// <summary>
/// Unit tests for <see cref="VerifyTotpCodeCommandHandler"/>.
/// Tests challenge token validation, valid/invalid TOTP verification, and per-user lockout.
/// </summary>
/// <remarks>
/// 80/20 Approach: Focuses on the handler orchestration (challenge token, lockout, success, failure).
/// Underlying <see cref="ITotpService"/> code validation is tested independently.
/// </remarks>
public sealed class VerifyTotpCodeCommandHandlerTests
{
	private const long TestUserId = 42;
	private const string TestEmail = "totp@example.com";
	private const string TestPlaintextSecret = "JBSWY3DPEHPK3PXP";
	private const string TestValidCode = "123456";
	private const string TestClientIp = "127.0.0.1";
	private const string TestChallengeToken = "valid-challenge-token";

	private readonly ITotpService TotpService;
	private readonly TotpSecretProtector TotpProtector;
	private readonly string ProtectedSecret;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly AuthenticationService AuthService;
	private readonly ISecurityAuditService SecurityAuditService;
	private readonly ITrustedDeviceService TrustedDeviceService;
	private readonly IMfaService MfaService;
	private readonly IMfaAttemptTracker AttemptTracker;

	public VerifyTotpCodeCommandHandlerTests()
	{
		TotpService =
			Substitute.For<ITotpService>();

		// TotpSecretProtector is sealed — use real instance with ephemeral provider
		IDataProtectionProvider dataProtectionProvider =
			new EphemeralDataProtectionProvider();
		TotpProtector =
			new TotpSecretProtector(dataProtectionProvider);
		ProtectedSecret =
			TotpProtector.Protect(TestPlaintextSecret);

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
	public async Task Handle_ValidChallengeTokenAndTotpCode_ReturnsSuccessAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTotpUser();

		ConfigureChallengeTokenValidation(success: true);
		ConfigureUserLookupById(user);
		ConfigureSuccessfulTotpVerification();
		ConfigureSuccessfulAuthResult(user);

		VerifyTotpCodeCommand command =
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
				MfaAttemptTypes.Totp);
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

		VerifyTotpCodeCommand command =
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

		VerifyTotpCodeCommand command =
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

		VerifyTotpCodeCommand command =
			CreateCommand(TestValidCode);

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.ChallengeUsed);
	}

	[Fact]
	public async Task Handle_InvalidTotp_ReturnsUnauthorizedAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTotpUser();

		ConfigureChallengeTokenValidation(success: true);
		ConfigureUserLookupById(user);

		TotpService
			.VerifyCode(
				TestPlaintextSecret,
				"wrong-code")
			.Returns(false);

		VerifyTotpCodeCommand command =
			CreateCommand("wrong-code");

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidCode);
		AttemptTracker
			.Received(1)
			.RecordFailedAttempt(
				TestUserId,
				MfaAttemptTypes.Totp);
	}

	[Fact]
	public async Task Handle_ExceededAttempts_ReturnsLockedOutAsync()
	{
		// Arrange
		ApplicationUser user =
			CreateTotpUser();

		ConfigureChallengeTokenValidation(success: true);
		ConfigureUserLookupById(user);

		AttemptTracker
			.IsLockedOut(
				TestUserId,
				MfaAttemptTypes.Totp)
			.Returns(true);

		VerifyTotpCodeCommand command =
			CreateCommand(TestValidCode);

		// Act
		AuthResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.TooManyAttempts);
	}

	private ApplicationUser CreateTotpUser()
	{
		return new UserBuilder(TimeProvider.System)
			.WithId(TestUserId)
			.WithEmail(TestEmail)
			.WithTotpSecret(ProtectedSecret)
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

	private void ConfigureSuccessfulTotpVerification()
	{
		TotpService
			.VerifyCode(
				TestPlaintextSecret,
				TestValidCode)
			.Returns(true);
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

	private static VerifyTotpCodeCommand CreateCommand(string code)
	{
		return new VerifyTotpCodeCommand(
			new VerifyTotpRequest(
				TestChallengeToken,
				code),
			TestClientIp);
	}

	private Task<AuthResult> InvokeHandlerAsync(VerifyTotpCodeCommand command)
	{
		return VerifyTotpCodeCommandHandler.HandleAsync(
			command,
			TotpService,
			TotpProtector,
			UserManager,
			AuthService,
			SecurityAuditService,
			TrustedDeviceService,
			MfaService,
			AttemptTracker,
			CancellationToken.None);
	}
}