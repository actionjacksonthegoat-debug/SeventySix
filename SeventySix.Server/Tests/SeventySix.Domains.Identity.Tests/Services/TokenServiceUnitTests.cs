// <copyright file="TokenServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for TokenService.
/// Tests JWT generation, refresh token creation, and revocation without a database.
/// </summary>
public sealed class TokenServiceUnitTests
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
	private readonly TokenService Service;

	public TokenServiceUnitTests()
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
			new TokenService(
			TokenRepository,
			SessionManagement,
			JwtOptions,
			TimeProvider,
			NullLogger<TokenService>.Instance);
	}

	#region GenerateAccessToken Tests

	/// <summary>
	/// Verifies a valid JWT is returned for valid input.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_ValidInput_ReturnsValidJwtAsync()
	{
		// Act
		string token =
			GenerateTestAccessToken(
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
	public void GenerateAccessToken_ContainsUserIdClaimAsync()
	{
		// Act
		string token =
			GenerateTestAccessToken(
			userId: 42,
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
	/// Verifies role claims are included in the token.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_ContainsRoleClaimsAsync()
	{
		// Act
		string token =
			GenerateTestAccessToken(
			roles: [TestRoleConstants.Developer, TestRoleConstants.Admin]);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		List<string> roleClaims =
			jwt
			.Claims.Where(claim => claim.Type == ClaimTypes.Role)
			.Select(claim => claim.Value)
			.ToList();

		roleClaims.ShouldContain(TestRoleConstants.Developer);
		roleClaims.ShouldContain(TestRoleConstants.Admin);
	}

	/// <summary>
	/// Verifies the token expires at the configured expiry time.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_ExpiresInConfiguredTimeAsync()
	{
		// Act
		string token = GenerateTestAccessToken();

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		DateTimeOffset expectedExpiry =
			FixedTime
			.AddMinutes(JwtOptions.Value.AccessTokenExpirationMinutes)
			.UtcDateTime;

		(Math.Abs((jwt.ValidTo - expectedExpiry).TotalSeconds) < 1).ShouldBeTrue(
			$"Expected expiry around {expectedExpiry}, got {jwt.ValidTo}");
	}

	[Fact]
	public void GenerateAccessToken_RequiresPasswordChange_IncludesClaimAsync()
	{
		string token =
			Service.GenerateAccessToken(
				userId: 1L,
				username: "testuser",
				roles: [],
				requiresPasswordChange: true);

		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		Claim? passwordChangeClaim =
			jwt.Claims.FirstOrDefault(
				claim => claim.Type == CustomClaimTypes.RequiresPasswordChange);

		passwordChangeClaim.ShouldNotBeNull();
		passwordChangeClaim.Value.ShouldBe("true");
	}

	[Fact]
	public void GenerateAccessToken_NoPasswordChangeRequired_ExcludesClaimAsync()
	{
		string token =
			GenerateTestAccessToken();

		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		Claim? passwordChangeClaim =
			jwt.Claims.FirstOrDefault(
				claim => claim.Type == CustomClaimTypes.RequiresPasswordChange);

		passwordChangeClaim.ShouldBeNull();
	}

	#endregion

	#region GenerateRefreshTokenAsync Tests

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

	#endregion

	#region RevokeRefreshTokenAsync Tests

	/// <summary>
	/// Verifies that revoking a valid token marks it as revoked.
	/// </summary>
	[Fact]
	public async Task RevokeRefreshTokenAsync_ValidToken_MarksRevokedAsync()
	{
		// Arrange
		string plainTextToken = "test-token-value";
		string expectedHash =
			CryptoExtensions.ComputeSha256Hash(plainTextToken);

		TokenRepository
			.RevokeByHashAsync(
				expectedHash,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(true);

		// Act
		bool result =
			await Service.RevokeRefreshTokenAsync(
			plainTextToken,
			CancellationToken.None);

		// Assert
		result.ShouldBeTrue();

		await TokenRepository
			.Received(1)
			.RevokeByHashAsync(
				expectedHash,
				FixedTime,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that revoking a nonexistent token returns false.
	/// </summary>
	[Fact]
	public async Task RevokeRefreshTokenAsync_NonexistentToken_ReturnsFalseAsync()
	{
		// Arrange
		TokenRepository
			.RevokeByHashAsync(
				Arg.Any<string>(),
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(false);

		// Act
		bool result =
			await Service.RevokeRefreshTokenAsync(
			"nonexistent",
			CancellationToken.None);

		// Assert
		result.ShouldBeFalse();
	}

	/// <summary>
	/// Verifies that revoking all user tokens delegates to the repository.
	/// </summary>
	[Fact]
	public async Task RevokeAllUserTokensAsync_RevokesAllAndReturnsCountAsync()
	{
		// Arrange
		TokenRepository
			.RevokeAllUserTokensAsync(
				1L,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>())
			.Returns(5);

		// Act
		int count =
			await Service.RevokeAllUserTokensAsync(
			userId: 1L,
			CancellationToken.None);

		// Assert
		count.ShouldBe(5);

		await TokenRepository
			.Received(1)
			.RevokeAllUserTokensAsync(
				1L,
				FixedTime,
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region RotateRefreshTokenAsync Tests

	[Fact]
	public async Task RotateRefreshTokenAsync_ReuseOfRevokedToken_RevokesFamilyAsync()
	{
		// Arrange — create a revoked token to simulate reuse attack
		Guid familyId =
			Guid.NewGuid();
		const long userId =
			42L;

		RefreshToken revokedToken =
			new RefreshTokenBuilder(TimeProvider)
				.WithUserId(userId)
				.WithFamilyId(familyId)
				.AsRevoked()
				.BuildWithPlainToken(out string plainToken);

		TokenRepository
			.GetByTokenHashAsync(
				Arg.Any<string>(),
				Arg.Any<CancellationToken>())
			.Returns(revokedToken);

		// Act
		(string? token, bool rememberMe) result =
			await Service.RotateRefreshTokenAsync(
				plainToken,
				CancellationToken.None);

		// Assert — token is null (reuse detected) and family is revoked
		result.token.ShouldBeNull();
		result.rememberMe.ShouldBeFalse();

		await TokenRepository
			.Received(1)
			.RevokeFamilyAsync(
				familyId,
				Arg.Any<DateTimeOffset>(),
				Arg.Any<CancellationToken>());
	}

	#endregion

	#region JWT Security Header Tests

	/// <summary>
	/// Verifies the token is signed with HMAC-SHA256 (HS256).
	/// Defense-in-depth: explicit algorithm check prevents alg:none downgrade attacks.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_UsesHmacSha256Algorithm()
	{
		// Act
		string token =
			GenerateTestAccessToken();

		// Assert
		JwtSecurityTokenHandler handler =
			new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		jwt.Header.Alg.ShouldBe(
			Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);
	}

	/// <summary>
	/// Verifies the JWT header contains a key-id (kid) value.
	/// Required for key rotation: the kid identifies which signing key was used,
	/// allowing graceful rotation without invalidating all existing tokens.
	/// </summary>
	[Fact]
	public void GenerateAccessToken_ContainsKidHeader()
	{
		// Act
		string token =
			GenerateTestAccessToken();

		// Assert
		JwtSecurityTokenHandler handler =
			new();
		JwtSecurityToken jwt =
			handler.ReadJwtToken(token);

		jwt.Header.Kid.ShouldNotBeNullOrEmpty(
			"JWT must include a kid header for key rotation support.");
	}

	#endregion

	#region Helper Methods

	/// <summary>
	/// Helper to generate access token for tests.
	/// </summary>
	/// <param name="userId">
	/// The user id to include in the token.
	/// </param>
	/// <param name="username">
	/// The username to include in the token.
	/// </param>
	/// <param name="roles">
	/// Roles to include as claims in the token.
	/// </param>
	/// <returns>
	/// The generated JWT access token string.
	/// </returns>
	private string GenerateTestAccessToken(
		long userId = 1L,
		string username = "testuser",
		List<string>? roles = null) =>
		Service.GenerateAccessToken(
			userId,
			username,
			roles ?? []);

	#endregion
}