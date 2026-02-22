// <copyright file="ResendMfaCodeCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using NSubstitute;
using Shouldly;
using Wolverine;

namespace SeventySix.Identity.Tests.Commands;

/// <summary>
/// Unit tests for <see cref="ResendMfaCodeCommandHandler"/>.
/// Tests challenge refresh failure and successful code resend.
/// </summary>
/// <remarks>
/// 80/20 Approach: Focuses on the handler orchestration (challenge refresh, email dispatch).
/// </remarks>
public sealed class ResendMfaCodeCommandHandlerTests
{
	private const long TestUserId = 42;
	private const string TestEmail = "mfa@example.com";
	private const string TestChallengeToken = "challenge-abc123";
	private const string TestNewCode = "654321";

	private readonly IMfaService MfaService;
	private readonly IMessageBus MessageBus;
	private readonly IOptions<MfaSettings> MfaSettings;
	private readonly ISecurityAuditService SecurityAuditService;

	/// <summary>
	/// Initializes a new instance of the <see cref="ResendMfaCodeCommandHandlerTests"/> class.
	/// </summary>
	public ResendMfaCodeCommandHandlerTests()
	{
		MfaService =
			Substitute.For<IMfaService>();
		MessageBus =
			Substitute.For<IMessageBus>();
		MfaSettings =
			Options.Create(
				new MfaSettings
				{
					Enabled = true,
					RequiredForAllUsers = false,
					CodeLength = 6,
					CodeExpirationMinutes = 5,
					MaxAttempts = 5,
					ResendCooldownSeconds = 60
				});
		SecurityAuditService =
			Substitute.For<ISecurityAuditService>();
	}

	[Fact]
	public async Task HandleAsync_ChallengeRefreshFails_ReturnsFailureAsync()
	{
		// Arrange
		MfaChallengeRefreshResult failedRefresh =
			MfaChallengeRefreshResult.Failed(
				"Challenge not found",
				MfaErrorCodes.InvalidChallenge);

		MfaService
			.RefreshChallengeAsync(
				TestChallengeToken,
				Arg.Any<CancellationToken>())
			.Returns(failedRefresh);

		ResendMfaCodeCommand command =
			CreateCommand(TestChallengeToken);

		// Act
		MfaChallengeRefreshResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidChallenge);
		await MessageBus
			.DidNotReceive()
			.InvokeAsync(
				Arg.Any<object>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task HandleAsync_ChallengeRefreshSucceeds_EnqueuesEmailAndReturnsSuccessAsync()
	{
		// Arrange
		MfaChallengeRefreshResult successRefresh =
			MfaChallengeRefreshResult.Succeeded(
				TestUserId,
				TestEmail,
				TestNewCode);

		MfaService
			.RefreshChallengeAsync(
				TestChallengeToken,
				Arg.Any<CancellationToken>())
			.Returns(successRefresh);

		ResendMfaCodeCommand command =
			CreateCommand(TestChallengeToken);

		// Act
		MfaChallengeRefreshResult result =
			await InvokeHandlerAsync(command);

		// Assert
		result.Success.ShouldBeTrue();
		result.UserId.ShouldBe(TestUserId);
		result.Email.ShouldBe(TestEmail);
		result.NewCode.ShouldBe(TestNewCode);
		await MessageBus
			.Received(1)
			.InvokeAsync(
				Arg.Any<object>(),
				Arg.Any<CancellationToken>());
		await SecurityAuditService
			.Received(1)
			.LogEventAsync(
				SecurityEventType.MfaCodeResent,
				userId: TestUserId,
				username: null,
				success: true,
				details: null,
				Arg.Any<CancellationToken>());
	}

	private static ResendMfaCodeCommand CreateCommand(string challengeToken) =>
		new(new ResendMfaCodeRequest(challengeToken));

	private Task<MfaChallengeRefreshResult> InvokeHandlerAsync(
		ResendMfaCodeCommand command) =>
		ResendMfaCodeCommandHandler.HandleAsync(
			command,
			MfaService,
			MessageBus,
			MfaSettings,
			SecurityAuditService,
			CancellationToken.None);
}