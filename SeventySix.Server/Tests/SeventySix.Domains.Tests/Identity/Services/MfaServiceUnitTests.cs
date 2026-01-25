// <copyright file="MfaServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Unit tests for MfaService.
/// Tests code generation and verification logic without database.
/// </summary>
public class MfaServiceUnitTests
{
	private static readonly DateTimeOffset FixedTime =
		new(2026, 1, 25, 12, 0, 0, TimeSpan.Zero);

	private readonly IMfaChallengeRepository ChallengeRepository;
	private readonly UserManager<ApplicationUser> UserManager;
	private readonly FakeTimeProvider TimeProviderField;
	private readonly IOptions<MfaSettings> Settings;
	private readonly MfaService Service;

	public MfaServiceUnitTests()
	{
		ChallengeRepository =
			Substitute.For<IMfaChallengeRepository>();
		UserManager =
			Substitute.For<UserManager<ApplicationUser>>(
				Substitute.For<IUserStore<ApplicationUser>>(),
				null, null, null, null, null, null, null, null);
		TimeProviderField =
			new FakeTimeProvider(FixedTime);
		Settings =
			Options.Create(
				new MfaSettings
				{
					Enabled = true,
					CodeLength = 6,
					CodeExpirationMinutes = 5,
					MaxAttempts = 5,
					ResendCooldownSeconds = 60
				});

		Service =
			new MfaService(
				Settings,
				ChallengeRepository,
				UserManager,
				TimeProviderField);
	}

	#region GenerateCode Tests

	[Fact]
	public void GenerateCode_ReturnsCorrectLength()
	{
		// Act
		string code =
			Service.GenerateCode();

		// Assert
		code.Length.ShouldBe(6);
	}

	[Fact]
	public void GenerateCode_ReturnsOnlyDigits()
	{
		// Act
		string code =
			Service.GenerateCode();

		// Assert
		code.All(char.IsDigit).ShouldBeTrue();
	}

	[Fact]
	public void GenerateCode_GeneratesUniqueCodes()
	{
		// Arrange
		HashSet<string> codes =
			[];

		// Act
		for (int index = 0; index < 100; index++)
		{
			codes.Add(Service.GenerateCode());
		}

		// Assert - With 6 digits and 100 generations, we should have many unique codes
		codes.Count.ShouldBeGreaterThan(90);
	}

	#endregion

	#region VerifyCodeAsync Tests

	[Fact]
	public async Task VerifyCodeAsync_ValidCode_ReturnsSuccessAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		const string code = "123456";

		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.WithCode(code)
				.WithUserId(1)
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act
		MfaVerificationResult result =
			await Service.VerifyCodeAsync(
				challengeToken,
				code,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.UserId.ShouldBe(1);
	}

	[Fact]
	public async Task VerifyCodeAsync_InvalidToken_ReturnsFailureAsync()
	{
		// Arrange
		ChallengeRepository
			.GetByTokenAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns((MfaChallenge?)null);

		// Act
		MfaVerificationResult result =
			await Service.VerifyCodeAsync(
				"invalid-token",
				"123456",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidChallenge);
	}

	[Fact]
	public async Task VerifyCodeAsync_InvalidCode_IncrementsAttemptsAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.WithCode("123456")
				.WithAttempts(0)
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act
		MfaVerificationResult result =
			await Service.VerifyCodeAsync(
				challengeToken,
				"wrong-code",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.InvalidCode);
		challenge.Attempts.ShouldBe(1);

		await ChallengeRepository
			.Received(1)
			.UpdateAsync(
				challenge,
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task VerifyCodeAsync_ExpiredCode_ReturnsFailureAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.AsExpired()
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act
		MfaVerificationResult result =
			await Service.VerifyCodeAsync(
				challengeToken,
				"123456",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.CodeExpired);
	}

	[Fact]
	public async Task VerifyCodeAsync_TooManyAttempts_ReturnsFailureAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.WithAttempts(5)
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act
		MfaVerificationResult result =
			await Service.VerifyCodeAsync(
				challengeToken,
				"123456",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.TooManyAttempts);
	}

	[Fact]
	public async Task VerifyCodeAsync_UsedChallenge_ReturnsFailureAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.AsUsed()
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act
		MfaVerificationResult result =
			await Service.VerifyCodeAsync(
				challengeToken,
				"123456",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.ChallengeUsed);
	}

	[Fact]
	public async Task VerifyCodeAsync_ValidCode_MarksChallengeAsUsedAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		const string code = "123456";

		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.WithCode(code)
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act
		await Service.VerifyCodeAsync(
			challengeToken,
			code,
			CancellationToken.None);

		// Assert
		challenge.IsUsed.ShouldBeTrue();

		await ChallengeRepository
			.Received(1)
			.UpdateAsync(
				challenge,
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region CreateChallengeAsync Tests

	[Fact]
	public async Task CreateChallengeAsync_CreatesValidChallengeAsync()
	{
		// Arrange
		const long userId = 42;
		const string clientIp = "192.168.1.1";
		MfaChallenge? capturedChallenge = null;

		ChallengeRepository
			.CreateAsync(
				Arg.Do<MfaChallenge>(challenge => capturedChallenge = challenge),
				Arg.Any<CancellationToken>())
			.Returns(Task.CompletedTask);

		// Act
		(string challengeToken, string code) result =
			await Service.CreateChallengeAsync(
				userId,
				clientIp,
				CancellationToken.None);

		// Assert
		result.challengeToken.ShouldNotBeNullOrEmpty();
		result.code.Length.ShouldBe(6);
		capturedChallenge.ShouldNotBeNull();
		capturedChallenge.UserId.ShouldBe(userId);
		capturedChallenge.ClientIp.ShouldBe(clientIp);
		capturedChallenge.IsUsed.ShouldBeFalse();
		capturedChallenge.Attempts.ShouldBe(0);
	}

	#endregion

	#region RefreshChallengeAsync Tests

	[Fact]
	public async Task RefreshChallengeAsync_WithinCooldown_ReturnsFailureAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.Build();

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		// Act - Challenge was just created (within 60 second cooldown)
		MfaChallengeRefreshResult result =
			await Service.RefreshChallengeAsync(
				challengeToken,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(MfaErrorCodes.ResendCooldown);
	}

	[Fact]
	public async Task RefreshChallengeAsync_AfterCooldown_ReturnsSuccessAsync()
	{
		// Arrange
		const string challengeToken = "test-token-123";
		const long userId = 42;
		const string email = "test@example.com";

		MfaChallenge challenge =
			new MfaChallengeBuilder(TimeProviderField)
				.WithToken(challengeToken)
				.WithUserId(userId)
				.Build();

		// Advance time past cooldown
		TimeProviderField.Advance(TimeSpan.FromSeconds(61));

		ChallengeRepository
			.GetByTokenAsync(
				challengeToken,
				Arg.Any<CancellationToken>())
			.Returns(challenge);

		ApplicationUser user =
			new() { Id = userId, Email = email };

		UserManager
			.FindByIdAsync(userId.ToString())
			.Returns(user);

		// Act
		MfaChallengeRefreshResult result =
			await Service.RefreshChallengeAsync(
				challengeToken,
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeTrue();
		result.Email.ShouldBe(email);
		result.NewCode.Length.ShouldBe(6);
	}

	#endregion
}