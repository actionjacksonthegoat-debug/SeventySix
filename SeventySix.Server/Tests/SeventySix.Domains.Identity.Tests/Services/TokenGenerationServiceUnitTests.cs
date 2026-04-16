// <copyright file="TokenGenerationServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="TokenGenerationService"/>.
/// Tests JWT access token creation and refresh token generation.
/// </summary>
public sealed class TokenGenerationServiceUnitTests
{
	/// <summary>
	/// Fixed time for deterministic tests.
	/// </summary>
	private static DateTimeOffset FixedTime =>
		TestTimeProviderBuilder.DefaultTime;

	private readonly ITokenRepository TokenRepository;
	private readonly ISessionManagementService SessionManagement;
	private readonly IOptions<JwtSettings> JwtOptions;
	private readonly FakeTimeProvider TimeProvider;
	private readonly TokenGenerationService Service;

	public TokenGenerationServiceUnitTests()
	{
		TokenRepository =
			Substitute.For<ITokenRepository>();
		SessionManagement =
			Substitute.For<ISessionManagementService>();
		JwtOptions =
			Options.Create(
			new JwtSettings
			{
				SecretKey = "TestSecretKeyThatIsAtLeast32CharactersLong!",
				Issuer = "SeventySix.Api",
				Audience = "SeventySix.Client",
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 1,
				RefreshTokenRememberMeExpirationDays = 14,
				AbsoluteSessionTimeoutDays = 30,
			});
		TimeProvider =
			new FakeTimeProvider(FixedTime);

		Service =
			new TokenGenerationService(
			TokenRepository,
			SessionManagement,
			JwtOptions,
			TimeProvider);
	}

	/// <summary>
	/// Verifies a valid JWT is returned for valid input.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_ValidInput_ReturnsValidJwt()
	{
		// Act
		string token =
			Service.GenerateAccessToken(
			userId: 1L,
			username: "testuser",
			roles: [TestRoleConstants.Developer, TestRoleConstants.Admin]);

		// Assert
		token.ShouldNotBeNull();
		token.ShouldNotBeEmpty();

		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		jwt.Issuer.ShouldBe(JwtOptions.Value.Issuer);
		jwt.Audiences.ShouldContain(JwtOptions.Value.Audience);
	}

	/// <summary>
	/// Verifies the token contains the expected subject (user id) claim.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_ContainsUserIdClaim()
	{
		// Act
		string token =
			Service.GenerateAccessToken(
			userId: 42,
			username: "testuser",
			roles: [TestRoleConstants.Developer]);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		Claim? subClaim =
			jwt.Claims.FirstOrDefault(claim =>
			claim.Type == JwtRegisteredClaimNames.Sub);

		subClaim.ShouldNotBeNull();
		subClaim.Value.ShouldBe("42");
	}

	/// <summary>
	/// Verifies refresh token generation calls session management and stores token.
	/// </summary>
	[Fact]
	public async Task GenerateRefreshTokenAsync_ReturnsSecureTokenAsync()
	{
		// Act
		string token =
			await Service.GenerateRefreshTokenAsync(
			userId: 1L,
			rememberMe: false,
			CancellationToken.None);

		// Assert
		token.ShouldNotBeNull();
		token.ShouldNotBeEmpty();

		await SessionManagement
			.Received(1)
			.EnforceSessionLimitAsync(
				1L,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());

		await TokenRepository
			.Received(1)
			.CreateAsync(
				Arg.Any<RefreshToken>(),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies refresh token with family delegates session enforcement and stores with correct family ID.
	/// </summary>
	[Fact]
	public async Task GenerateRefreshTokenWithFamilyAsync_InheritsFamilyIdAsync()
	{
		// Arrange
		Guid familyId = Guid.NewGuid();
		DateTimeOffset sessionStart =
			FixedTime.AddDays(-5);

		// Act
		string token =
			await Service.GenerateRefreshTokenWithFamilyAsync(
			userId: 1L,
			rememberMe: true,
			familyId: familyId,
			sessionStartedAt: sessionStart,
			CancellationToken.None);

		// Assert
		token.ShouldNotBeNull();

		await TokenRepository
			.Received(1)
			.CreateAsync(
				Arg.Is<RefreshToken>(refreshToken =>
					refreshToken.FamilyId == familyId &&
					refreshToken.SessionStartedAt == sessionStart &&
					refreshToken.UserId == 1L),
				Arg.Any<CancellationToken>());
	}
}