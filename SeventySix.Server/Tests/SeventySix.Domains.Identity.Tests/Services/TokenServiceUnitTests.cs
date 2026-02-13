// <copyright file="TokenServiceUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for TokenService JWT generation logic.
/// These tests do NOT require a database - they test pure JWT generation.
/// </summary>
public class TokenServiceUnitTests
{
	/// <summary>
	/// Fixed time for deterministic tests.
	/// </summary>
	private static DateTimeOffset FixedTime =>
		TestTimeProviderBuilder.DefaultTime;

	private readonly ITokenRepository TokenRepository;
	private readonly IOptions<JwtSettings> JwtOptions;
	private readonly IOptions<AuthSettings> AuthOptions;
	private readonly FakeTimeProvider TimeProvider;
	private readonly TokenService Service;

	public TokenServiceUnitTests()
	{
		TokenRepository =
			Substitute.For<ITokenRepository>();
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
		AuthOptions =
			Options.Create(
			new AuthSettings
			{
				Token =
					new TokenSettings { MaxActiveSessionsPerUser = 5 },
			});
		TimeProvider =
			new FakeTimeProvider(FixedTime);

		Service =
			new TokenService(
			TokenRepository,
			JwtOptions,
			AuthOptions,
			NullLogger<TokenService>.Instance,
			TimeProvider);
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

		DateTime expectedExpiry =
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