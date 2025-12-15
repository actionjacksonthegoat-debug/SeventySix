// <copyright file="TokenServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Integration tests for TokenService.
/// Tests JWT generation, refresh token lifecycle, and validation using real PostgreSQL.
/// </summary>
[Collection("DatabaseTests")]
public class TokenServiceTests(TestcontainersPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	/// <summary>
	/// Fixed time for deterministic tests. Uses shared constant from TestTimeProviderBuilder.
	/// </summary>
	private static DateTimeOffset FixedTime => TestTimeProviderBuilder.DefaultTime;

	private IOptions<JwtSettings> JwtOptions =>
		Options.Create(
			new JwtSettings
			{
				SecretKey = "TestSecretKeyThatIsAtLeast32CharactersLong!",
				Issuer = "SeventySix.Api",
				Audience = "SeventySix.Client",
				AccessTokenExpirationMinutes = 15,
				RefreshTokenExpirationDays = 1,
				RefreshTokenRememberMeExpirationDays = 14,
				AbsoluteSessionTimeoutDays = 30
			});

	private IOptions<AuthSettings> AuthOptions =>
		Options.Create(
			new AuthSettings
			{
				Token = new TokenSettings
				{
					MaxActiveSessionsPerUser = 5
				}
			});

	private TokenService CreateService(IdentityDbContext context)
	{
		ITokenRepository tokenRepository =
			new TokenRepository(context);

		return new TokenService(
			tokenRepository,
			JwtOptions,
			AuthOptions,
			NullLogger<TokenService>.Instance,
			TestTimeProviderBuilder.CreateDefault());
	}

	#region GenerateAccessToken Tests

	[Fact]
	public void GenerateAccessToken_ValidInput_ReturnsValidJwt()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		string token =
			GenerateTestAccessToken(
				service,
				roles: [TestRoleConstants.Developer, TestRoleConstants.Admin]);

		// Assert
		Assert.NotNull(token);
		Assert.NotEmpty(token);

		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		Assert.Equal(JwtOptions.Value.Issuer, jwt.Issuer);
		Assert.Contains(JwtOptions.Value.Audience, jwt.Audiences);
	}

	[Fact]
	public void GenerateAccessToken_ContainsUserIdClaim()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		string token =
			GenerateTestAccessToken(
				service,
				userId: 42,
				roles: [TestRoleConstants.Developer]);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		Claim? subClaim =
			jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);

		Assert.NotNull(subClaim);
		Assert.Equal("42", subClaim.Value);
	}

	[Fact]
	public void GenerateAccessToken_ContainsRoleClaims()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		string token =
			GenerateTestAccessToken(
				service,
				roles: [TestRoleConstants.Developer, TestRoleConstants.Admin]);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		List<string> roleClaims =
			jwt.Claims
				.Where(c => c.Type == ClaimTypes.Role)
				.Select(c => c.Value)
				.ToList();

		Assert.Contains(TestRoleConstants.Developer, roleClaims);
		Assert.Contains(TestRoleConstants.Admin, roleClaims);
	}

	[Fact]
	public void GenerateAccessToken_ExpiresInConfiguredTime()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		string token = GenerateTestAccessToken(service);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		DateTime expectedExpiry =
			FixedTime
				.AddMinutes(JwtOptions.Value.AccessTokenExpirationMinutes)
				.UtcDateTime;

		Assert.True(
			Math.Abs((jwt.ValidTo - expectedExpiry).TotalSeconds) < 1,
			$"Expected expiry around {expectedExpiry}, got {jwt.ValidTo}");
	}

	[Theory]
	[InlineData("John Doe", "John Doe")]
	[InlineData(null, "")]
	public void GenerateAccessToken_ContainsGivenNameClaim_WithExpectedValue(
		string? fullName,
		string expectedClaimValue)
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		string token = GenerateTestAccessToken(service, fullName: fullName);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		Claim? givenNameClaim =
			jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.GivenName);

		Assert.NotNull(givenNameClaim);
		Assert.Equal(expectedClaimValue, givenNameClaim.Value);
	}
	#endregion
	#region GenerateRefreshTokenAsync Tests

	[Theory]
	[InlineData(false, 1)]
	[InlineData(true, 14)]
	public async Task GenerateRefreshTokenAsync_CreatesTokenWithCorrectExpirationAsync(
		bool rememberMe,
		int expectedExpirationDays)
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);
		TokenService service = CreateService(context);

		// Act
		string refreshToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				rememberMe,
				CancellationToken.None);

		// Assert
		Assert.NotNull(refreshToken);
		Assert.NotEmpty(refreshToken);

		RefreshToken? storedToken =
			await context.RefreshTokens
				.FirstOrDefaultAsync(t => t.UserId == user.Id);

		Assert.NotNull(storedToken);
		Assert.False(storedToken.IsRevoked);
		Assert.Equal("127.0.0.1", storedToken.CreatedByIp);

		DateTime expectedExpiry =
			FixedTime
				.AddDays(expectedExpirationDays)
				.UtcDateTime;

		Assert.Equal(
			expectedExpiry,
			storedToken.ExpiresAt,
			TimeSpan.FromSeconds(1));
	}
	#endregion
	#region ValidateRefreshTokenAsync Tests

	[Theory]
	[InlineData("valid", true)]
	[InlineData("invalid", false)]
	[InlineData("expired", false)]
	[InlineData("revoked", false)]
	public async Task ValidateRefreshTokenAsync_ReturnsExpectedResultAsync(
		string tokenType,
		bool shouldReturnUserId)
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);
		TokenService service = CreateService(context);
		string tokenValue;

		switch (tokenType)
		{
			case "valid":
				tokenValue =
					await service.GenerateRefreshTokenAsync(
						user.Id,
						"127.0.0.1",
						rememberMe: false,
						CancellationToken.None);
				break;

			case "invalid":
				tokenValue = "invalid-token";
				break;

			case "expired":
				string testId = Guid.NewGuid().ToString("N")[..8];
				tokenValue = $"expired-validate-{testId}";
				RefreshToken expiredToken =
					new()
					{
						TokenHash = ComputeSha256Hash(tokenValue),
						UserId = user.Id,
						ExpiresAt = FixedTime.AddDays(-1).UtcDateTime,
						CreateDate = FixedTime.AddDays(-8).UtcDateTime,
						IsRevoked = false
					};
				context.RefreshTokens.Add(expiredToken);
				await context.SaveChangesAsync();
				break;

			case "revoked":
				tokenValue =
					await service.GenerateRefreshTokenAsync(
						user.Id,
						"127.0.0.1",
						rememberMe: false,
						CancellationToken.None);
				await service.RevokeRefreshTokenAsync(
					tokenValue,
					CancellationToken.None);
				break;

			default:
				throw new ArgumentException($"Unknown token type: {tokenType}");
		}

		// Act
		int? actualUserId =
			await service.ValidateRefreshTokenAsync(
				tokenValue,
				CancellationToken.None);

		// Assert
		if (shouldReturnUserId)
		{
			Assert.NotNull(actualUserId);
			Assert.Equal(user.Id, actualUserId.Value);
		}
		else
		{
			Assert.Null(actualUserId);
		}
	}
	#endregion
	#region RevokeRefreshTokenAsync Tests

	[Theory]
	[InlineData(true, true)]
	[InlineData(false, false)]
	public async Task RevokeRefreshTokenAsync_ReturnsExpectedResultAsync(
		bool isValidToken,
		bool expectedResult)
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);
		string tokenToRevoke;
		int? userId = null;

		if (isValidToken)
		{
			User user = await CreateTestUserAsync(context);
			userId = user.Id;
			tokenToRevoke =
				await service.GenerateRefreshTokenAsync(
					user.Id,
					"127.0.0.1",
					rememberMe: false,
					CancellationToken.None);
		}
		else
		{
			tokenToRevoke = "nonexistent-token";
		}

		// Act
		bool actualResult =
			await service.RevokeRefreshTokenAsync(
				tokenToRevoke,
				CancellationToken.None);

		// Assert
		Assert.Equal(expectedResult, actualResult);

		if (isValidToken)
		{
			RefreshToken? storedToken =
				await context.RefreshTokens
					.AsNoTracking()
					.FirstAsync(token => token.UserId == userId);

			Assert.True(storedToken.IsRevoked);
			Assert.NotNull(storedToken.RevokedAt);
		}
	}
	#endregion
	#region RevokeAllUserTokensAsync Tests

	[Theory]
	[InlineData(3, 3)]
	[InlineData(0, 0)]
	public async Task RevokeAllUserTokensAsync_RevokesExpectedCountAsync(
		int tokensToCreate,
		int expectedRevokedCount)
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);
		int userId;

		if (tokensToCreate > 0)
		{
			User user = await CreateTestUserAsync(context);
			userId = user.Id;

			for (int index = 0; index < tokensToCreate; index++)
			{
				await service.GenerateRefreshTokenAsync(
					user.Id,
					$"127.0.0.{index + 1}",
					rememberMe: false,
					CancellationToken.None);
			}
		}
		else
		{
			userId = 99999;
		}

		// Act
		int actualRevokedCount =
			await service.RevokeAllUserTokensAsync(
				userId,
				CancellationToken.None);

		// Assert
		Assert.Equal(expectedRevokedCount, actualRevokedCount);

		if (tokensToCreate > 0)
		{
			List<RefreshToken> tokens =
				await context.RefreshTokens
					.AsNoTracking()
					.Where(t => t.UserId == userId)
					.ToListAsync();

			Assert.All(tokens, t => Assert.True(t.IsRevoked));
		}
	}
	#endregion
	#region Session Limit Tests

	[Fact]
	public async Task GenerateRefreshTokenAsync_RevokesOldestToken_WhenSessionLimitReachedAsync()
	{
		// Arrange - Create custom options with low session limit for testing
		IOptions<AuthSettings> limitedAuthOptions =
			Options.Create(
				new AuthSettings
				{
					Token = new TokenSettings
					{
						MaxActiveSessionsPerUser = 2
					}
				});

		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		// Use advancing time to ensure tokens have different CreatedAt values
		DateTimeOffset currentTime = FixedTime;
		TimeProvider timeProvider = Substitute.For<TimeProvider>();
		timeProvider.GetUtcNow().Returns(
			_ =>
			{
				DateTimeOffset result = currentTime;
				currentTime = currentTime.AddMinutes(1);
				return result;
			});

		ITokenRepository tokenRepository =
			new TokenRepository(context);

		TokenService service =
			new(
				tokenRepository,
				JwtOptions,
				limitedAuthOptions,
				NullLogger<TokenService>.Instance,
				timeProvider);

		// Act - Create tokens up to and beyond limit
		string firstToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"192.168.1.1",
				rememberMe: false,
				CancellationToken.None);

		string secondToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"192.168.1.2",
				rememberMe: false,
				CancellationToken.None);

		// This should trigger revocation of the oldest (first) token
		string thirdToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"192.168.1.3",
				rememberMe: false,
				CancellationToken.None);

		// Assert - First token should be revoked
		List<RefreshToken> tokens =
			await context.RefreshTokens
				.AsNoTracking()
				.Where(t => t.UserId == user.Id)
				.OrderBy(t => t.CreateDate)
				.ToListAsync();

		Assert.Equal(3, tokens.Count);

		// Oldest token (first) should be revoked
		Assert.True(tokens[0].IsRevoked);
		Assert.NotNull(tokens[0].RevokedAt);

		// Second and third tokens should still be active
		Assert.False(tokens[1].IsRevoked);
		Assert.False(tokens[2].IsRevoked);
	}
	#endregion
	#region Token Family Reuse Detection Tests

	[Fact]
	public async Task GenerateRefreshTokenAsync_CreatesNewFamily_WhenNoParentTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		(TokenService service, User user) =
			await CreateServiceWithUserAsync(context);

		// Act
		await service.GenerateRefreshTokenAsync(
			user.Id,
			"127.0.0.1",
			rememberMe: false,
			CancellationToken.None);

		// Assert
		RefreshToken? storedToken =
			await context.RefreshTokens
				.AsNoTracking()
				.FirstOrDefaultAsync(t => t.UserId == user.Id);

		Assert.NotNull(storedToken);
		Assert.NotEqual(Guid.Empty, storedToken.FamilyId);
	}

	[Fact]
	public async Task RotateRefreshTokenAsync_InheritsFamilyId_FromParentTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		(TokenService service, User user, string originalToken) =
			await CreateServiceWithUserAndTokenAsync(context);

		Guid originalFamilyId =
			await GetTokenFamilyIdAsync(
				context,
				user.Id);

		// Act
		string? newToken =
			await service.RotateRefreshTokenAsync(
				originalToken,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.NotNull(newToken);
		Assert.NotEqual(originalToken, newToken);

		RefreshToken? newStoredToken =
			await context.RefreshTokens
				.AsNoTracking()
				.Where(t => t.UserId == user.Id)
				.Where(t => !t.IsRevoked)
				.FirstOrDefaultAsync();

		Assert.NotNull(newStoredToken);
		Assert.Equal(originalFamilyId, newStoredToken.FamilyId);
	}

	[Fact]
	public async Task RotateRefreshTokenAsync_RevokesOriginalToken_OnRotationAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		(TokenService service, _, string originalToken) =
			await CreateServiceWithUserAndTokenAsync(context);

		// Act
		await service.RotateRefreshTokenAsync(
			originalToken,
			"127.0.0.1",
			CancellationToken.None);

		// Assert - Original token should be revoked
		int? userId =
			await service.ValidateRefreshTokenAsync(
				originalToken,
				CancellationToken.None);

		Assert.Null(userId);
	}

	[Fact]
	public async Task ValidateRefreshTokenAsync_ReturnsNull_WhenRevokedTokenReusedAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		(TokenService service, _, string originalToken) =
			await CreateServiceWithUserAndTokenAsync(context);

		// Legitimate rotation - creates new token, revokes original
		await service.RotateRefreshTokenAsync(
			originalToken,
			"127.0.0.1",
			CancellationToken.None);

		// Act - Attacker tries to use the revoked original token
		int? userId =
			await service.ValidateRefreshTokenAsync(
				originalToken,
				CancellationToken.None);

		// Assert
		Assert.Null(userId);
	}

	[Fact]
	public async Task RotateRefreshTokenAsync_RevokesEntireFamily_WhenRevokedTokenReusedAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		(TokenService service, User user, string originalToken) =
			await CreateServiceWithUserAndTokenAsync(context);

		// Legitimate rotation - attacker doesn't know about this
		string? legitimateNewToken =
			await service.RotateRefreshTokenAsync(
				originalToken,
				"127.0.0.1",
				CancellationToken.None);

		Assert.NotNull(legitimateNewToken);

		// Act - Attacker tries to rotate the revoked original token
		string? attackerToken =
			await service.RotateRefreshTokenAsync(
				originalToken,
				"192.168.1.100", // Different IP - attacker
				CancellationToken.None);

		// Assert - Attack detected, returns null
		Assert.Null(attackerToken);

		// Verify ENTIRE family is revoked (including legitimate user's new token)
		List<RefreshToken> familyTokens =
			await context.RefreshTokens
				.AsNoTracking()
				.Where(t => t.UserId == user.Id)
				.ToListAsync();

		Assert.All(familyTokens, t => Assert.True(t.IsRevoked));

		// Verify legitimate user's new token no longer works
		int? userId =
			await service.ValidateRefreshTokenAsync(
				legitimateNewToken,
				CancellationToken.None);

		Assert.Null(userId);
	}

	[Theory]
	[InlineData("nonexistent-token", false, "not found")]
	public async Task RotateRefreshTokenAsync_ReturnsNull_WhenTokenInvalidAsync(
		string token,
		bool createExpired,
		string reason)
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		_ = createExpired; // For future use
		_ = reason; // Used for test name readability

		// Act
		string? result =
			await service.RotateRefreshTokenAsync(
				token,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.Null(result);
	}
	#endregion
	#region Helper Methods

	/// <summary>
	/// Helper to generate access token for tests.
	/// </summary>
	private string GenerateTestAccessToken(
		TokenService service,
		int userId = 1,
		string username = "testuser",
		string email = "test@example.com",
		string? fullName = null,
		List<string>? roles = null) =>
		service.GenerateAccessToken(
			userId,
			username,
			email,
			fullName,
			roles ?? []);

	/// <summary>
	/// Creates a service with a test user already created.
	/// </summary>
	private async Task<(TokenService Service, User User)> CreateServiceWithUserAsync(
		IdentityDbContext context)
	{
		User user = await CreateTestUserAsync(context);
		TokenService service = CreateService(context);

		return (service, user);
	}

	/// <summary>
	/// Creates a service with a test user and an initial refresh token.
	/// </summary>
	private async Task<(TokenService Service, User User, string Token)> CreateServiceWithUserAndTokenAsync(
		IdentityDbContext context)
	{
		User user = await CreateTestUserAsync(context);
		TokenService service = CreateService(context);

		string token =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				rememberMe: false,
				CancellationToken.None);

		return (service, user, token);
	}

	/// <summary>
	/// Gets the FamilyId of the first token for a user.
	/// </summary>
	private static async Task<Guid> GetTokenFamilyIdAsync(
		IdentityDbContext context,
		int userId)
	{
		RefreshToken? token =
			await context.RefreshTokens
				.AsNoTracking()
				.FirstOrDefaultAsync(t => t.UserId == userId);

		return token?.FamilyId ?? Guid.Empty;
	}

	private async Task<User> CreateTestUserAsync(IdentityDbContext context)
	{
		User user =
			new()
			{
				Username = $"testuser_{Guid.NewGuid():N}",
				Email = $"test_{Guid.NewGuid():N}@example.com",
				IsActive = true,
				CreateDate = FixedTime.UtcDateTime,
				CreatedBy = "Test"
			};

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}

	private static string ComputeSha256Hash(string input)
	{
		byte[] bytes =
			System.Security.Cryptography.SHA256.HashData(
				System.Text.Encoding.UTF8.GetBytes(input));

		return Convert.ToHexString(bytes);
	}

	#endregion
}
