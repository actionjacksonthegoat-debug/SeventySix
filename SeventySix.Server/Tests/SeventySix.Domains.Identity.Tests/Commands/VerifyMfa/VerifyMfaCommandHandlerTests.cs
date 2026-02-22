// <copyright file="VerifyMfaCommandHandlerTests.cs" company="SeventySix">
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
/// Unit tests for <see cref="VerifyMfaCommandHandler"/>.
/// Tests the orchestration layer for email-based MFA verification.
/// </summary>
/// <remarks>
/// 80/20 Approach: Tests valid/invalid/expired scenarios.
/// Underlying <see cref="IMfaService"/> is tested independently.
/// </remarks>
public sealed class VerifyMfaCommandHandlerTests
{
	private const long TestUserId = 42;
	private const string TestEmail = "test@example.com";
	private const string TestChallengeToken = "challenge-token-abc";
	private const string TestCode = "123456";
	private const string TestClientIp = "127.0.0.1";

	private readonly IMfaService MfaService;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly AuthenticationService AuthService;
	private readonly ISecurityAuditService SecurityAuditService;
	private readonly ITrustedDeviceService TrustedDeviceService;

	public VerifyMfaCommandHandlerTests()
	{
		MfaService =
			Substitute.For<IMfaService>();
		UserManager =
			IdentityMockFactory.CreateUserManager();
		AuthService =
			IdentityMockFactory.CreateAuthenticationService();
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
		TrustedDeviceService =
			Substitute.For<ITrustedDeviceService>();
	}

	[Fact]
	public async Task Handle_ValidCode_ReturnsSuccessAsync()
	{
		// Arrange
		ApplicationUser user =
			new UserBuilder(TimeProvider.System)
				.WithId(TestUserId)
				.WithEmail(TestEmail)
				.Build();

		MfaService
			.VerifyCodeAsync(
				TestChallengeToken,
				TestCode,
				Arg.Any<CancellationToken>())
			.Returns(MfaVerificationResult.Succeeded(TestUserId));

		UserManager
			.FindByIdAsync(TestUserId.ToString())
			.Returns(user);

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

		VerifyMfaCommand command =
			new(
				new VerifyMfaRequest(
					TestChallengeToken,
					TestCode),
				TestClientIp);

		// Act
		AuthResult result =
			await VerifyMfaCommandHandler.HandleAsync(
				command,
				MfaService,
				UserManager,
				AuthService,
				SecurityAuditService,
				TrustedDeviceService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.AccessToken.ShouldNotBeNull();
	}

	[Fact]
	public async Task Handle_InvalidCode_ReturnsUnauthorizedAsync()
	{
		// Arrange
		MfaService
			.VerifyCodeAsync(
				TestChallengeToken,
				"wrong-code",
				Arg.Any<CancellationToken>())
			.Returns(MfaVerificationResult.Failed(
				TestUserId,
				"Invalid verification code",
				MfaErrorCodes.InvalidCode));

		VerifyMfaCommand command =
			new(
				new VerifyMfaRequest(
					TestChallengeToken,
					"wrong-code"),
				TestClientIp);

		// Act
		AuthResult result =
			await VerifyMfaCommandHandler.HandleAsync(
				command,
				MfaService,
				UserManager,
				AuthService,
				SecurityAuditService,
				TrustedDeviceService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidCode);
	}

	[Fact]
	public async Task Handle_ExpiredChallenge_ReturnsUnauthorizedAsync()
	{
		// Arrange
		MfaService
			.VerifyCodeAsync(
				TestChallengeToken,
				TestCode,
				Arg.Any<CancellationToken>())
			.Returns(MfaVerificationResult.Failed(
				TestUserId,
				"Challenge expired",
				MfaErrorCodes.CodeExpired));

		VerifyMfaCommand command =
			new(
				new VerifyMfaRequest(
					TestChallengeToken,
					TestCode),
				TestClientIp);

		// Act
		AuthResult result =
			await VerifyMfaCommandHandler.HandleAsync(
				command,
				MfaService,
				UserManager,
				AuthService,
				SecurityAuditService,
				TrustedDeviceService,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.CodeExpired);
	}
}