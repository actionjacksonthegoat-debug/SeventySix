// <copyright file="TokenServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Tests.Identity.Services;

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
				RefreshTokenExpirationDays = 7
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
		return new TokenService(
			context,
			JwtOptions,
			AuthOptions,
			TestTimeProviderBuilder.CreateDefault());
	}

	#region GenerateAccessToken Tests

	[Fact]
	public void GenerateAccessToken_ValidInput_ReturnsValidJwt()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		int userId = 1;
		string username = "testuser";
		string email = "test@example.com";
		List<string> roles = ["Developer", "Admin"];

		// Act
		string token =
			service.GenerateAccessToken(
				userId,
				username,
				email,
				fullName: null,
				roles);

		// Assert
		Assert.NotNull(token);
		Assert.NotEmpty(token);

		// Verify token structure
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

		int userId = 42;
		string username = "testuser";
		string email = "test@example.com";
		List<string> roles = ["Developer"];

		// Act
		string token =
			service.GenerateAccessToken(
				userId,
				username,
				email,
				fullName: null,
				roles);

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

		int userId = 1;
		string username = "testuser";
		string email = "test@example.com";
		List<string> roles = ["Developer", "Admin"];

		// Act
		string token =
			service.GenerateAccessToken(
				userId,
				username,
				email,
				fullName: null,
				roles);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		List<string> roleClaims =
			jwt.Claims
				.Where(c => c.Type == ClaimTypes.Role)
				.Select(c => c.Value)
				.ToList();

		Assert.Contains("Developer", roleClaims);
		Assert.Contains("Admin", roleClaims);
	}

	[Fact]
	public void GenerateAccessToken_ExpiresInConfiguredTime()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		int userId = 1;
		string username = "testuser";
		string email = "test@example.com";
		List<string> roles = [];

		// Act
		string token =
			service.GenerateAccessToken(
				userId,
				username,
				email,
				fullName: null,
				roles);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		DateTime expectedExpiry =
			FixedTime
				.AddMinutes(JwtOptions.Value.AccessTokenExpirationMinutes)
				.UtcDateTime;

		// Allow 1 second tolerance for test execution time
		Assert.True(
			Math.Abs((jwt.ValidTo - expectedExpiry).TotalSeconds) < 1,
			$"Expected expiry around {expectedExpiry}, got {jwt.ValidTo}");
	}

	[Fact]
	public void GenerateAccessToken_ContainsGivenNameClaim_WhenFullNameProvided()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		int userId = 1;
		string username = "testuser";
		string email = "test@example.com";
		string fullName = "John Doe";
		List<string> roles = [];

		// Act
		string token =
			service.GenerateAccessToken(
				userId,
				username,
				email,
				fullName,
				roles);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		Claim? givenNameClaim =
			jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.GivenName);

		Assert.NotNull(givenNameClaim);
		Assert.Equal(fullName, givenNameClaim.Value);
	}

	[Fact]
	public void GenerateAccessToken_ContainsEmptyGivenNameClaim_WhenFullNameNull()
	{
		// Arrange
		using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		int userId = 1;
		string username = "testuser";
		string email = "test@example.com";
		string? fullName = null;
		List<string> roles = [];

		// Act
		string token =
			service.GenerateAccessToken(
				userId,
				username,
				email,
				fullName,
				roles);

		// Assert
		JwtSecurityTokenHandler handler = new();
		JwtSecurityToken jwt = handler.ReadJwtToken(token);

		Claim? givenNameClaim =
			jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.GivenName);

		Assert.NotNull(givenNameClaim);
		Assert.Equal(string.Empty, givenNameClaim.Value);
	}

	#endregion

	#region GenerateRefreshTokenAsync Tests

	[Fact]
	public async Task GenerateRefreshTokenAsync_CreatesTokenInDatabaseAsync()
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
				CancellationToken.None);

		// Assert
		Assert.NotNull(refreshToken);
		Assert.NotEmpty(refreshToken);

		// Verify token was stored in database
		RefreshToken? storedToken =
			await context.RefreshTokens
				.FirstOrDefaultAsync(t => t.UserId == user.Id);

		Assert.NotNull(storedToken);
		Assert.False(storedToken.IsRevoked);
		Assert.Equal("127.0.0.1", storedToken.CreatedByIp);
	}

	[Fact]
	public async Task GenerateRefreshTokenAsync_SetsCorrectExpirationAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		TokenService service = CreateService(context);

		// Act
		await service.GenerateRefreshTokenAsync(
			user.Id,
			"127.0.0.1",
			CancellationToken.None);

		// Assert
		RefreshToken? storedToken =
			await context.RefreshTokens
				.FirstOrDefaultAsync(t => t.UserId == user.Id);

		Assert.NotNull(storedToken);

		DateTime expectedExpiry =
			FixedTime
				.AddDays(JwtOptions.Value.RefreshTokenExpirationDays)
				.UtcDateTime;

		Assert.Equal(
			expectedExpiry,
			storedToken.ExpiresAt,
			TimeSpan.FromSeconds(1));
	}

	#endregion

	#region ValidateRefreshTokenAsync Tests

	[Fact]
	public async Task ValidateRefreshTokenAsync_ValidToken_ReturnsUserIdAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		TokenService service = CreateService(context);

		string refreshToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				CancellationToken.None);

		// Act
		int? userId =
			await service.ValidateRefreshTokenAsync(
				refreshToken,
				CancellationToken.None);

		// Assert
		Assert.NotNull(userId);
		Assert.Equal(user.Id, userId.Value);
	}

	[Fact]
	public async Task ValidateRefreshTokenAsync_InvalidToken_ReturnsNullAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		int? userId =
			await service.ValidateRefreshTokenAsync(
				"invalid-token",
				CancellationToken.None);

		// Assert
		Assert.Null(userId);
	}

	[Fact]
	public async Task ValidateRefreshTokenAsync_ExpiredToken_ReturnsNullAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		string tokenValue = $"expired-validate-{testId}";
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		// Create an already expired token directly in database
		RefreshToken expiredToken =
			new()
			{
				TokenHash = ComputeSha256Hash(tokenValue),
				UserId = user.Id,
				ExpiresAt = FixedTime.AddDays(-1).UtcDateTime, // Already expired
				CreateDate = FixedTime.AddDays(-8).UtcDateTime,
				IsRevoked = false
			};

		context.RefreshTokens.Add(expiredToken);
		await context.SaveChangesAsync();

		TokenService service = CreateService(context);

		// Act
		int? userId =
			await service.ValidateRefreshTokenAsync(
				tokenValue,
				CancellationToken.None);

		// Assert
		Assert.Null(userId);
	}

	[Fact]
	public async Task ValidateRefreshTokenAsync_RevokedToken_ReturnsNullAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		TokenService service = CreateService(context);

		string refreshToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				CancellationToken.None);

		// Revoke the token
		await service.RevokeRefreshTokenAsync(
			refreshToken,
			CancellationToken.None);

		// Act
		int? userId =
			await service.ValidateRefreshTokenAsync(
				refreshToken,
				CancellationToken.None);

		// Assert
		Assert.Null(userId);
	}

	#endregion

	#region RevokeRefreshTokenAsync Tests

	[Fact]
	public async Task RevokeRefreshTokenAsync_ValidToken_RevokesSuccessfullyAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		TokenService service = CreateService(context);

		string refreshToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"127.0.0.1",
				CancellationToken.None);

		// Act
		bool result =
			await service.RevokeRefreshTokenAsync(
				refreshToken,
				CancellationToken.None);

		// Assert
		Assert.True(result);

		// Note: ExecuteUpdateAsync bypasses change tracker, use AsNoTracking for fresh data
		RefreshToken? storedToken =
			await context.RefreshTokens
				.AsNoTracking()
				.FirstOrDefaultAsync(t => t.UserId == user.Id);

		Assert.NotNull(storedToken);
		Assert.True(storedToken.IsRevoked);
		Assert.NotNull(storedToken.RevokedAt);
	}

	[Fact]
	public async Task RevokeRefreshTokenAsync_InvalidToken_ReturnsFalseAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		bool result =
			await service.RevokeRefreshTokenAsync(
				"nonexistent-token",
				CancellationToken.None);

		// Assert
		Assert.False(result);
	}

	#endregion

	#region RevokeAllUserTokensAsync Tests

	[Fact]
	public async Task RevokeAllUserTokensAsync_RevokesAllTokensAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		TokenService service = CreateService(context);

		// Create multiple tokens
		await service.GenerateRefreshTokenAsync(
			user.Id,
			"127.0.0.1",
			CancellationToken.None);

		await service.GenerateRefreshTokenAsync(
			user.Id,
			"127.0.0.2",
			CancellationToken.None);

		await service.GenerateRefreshTokenAsync(
			user.Id,
			"127.0.0.3",
			CancellationToken.None);

		// Act
		int revokedCount =
			await service.RevokeAllUserTokensAsync(
				user.Id,
				CancellationToken.None);

		// Assert
		Assert.Equal(3, revokedCount);

		// Note: ExecuteUpdateAsync bypasses change tracker, use AsNoTracking for fresh data
		List<RefreshToken> tokens =
			await context.RefreshTokens
				.AsNoTracking()
				.Where(t => t.UserId == user.Id)
				.ToListAsync();

		Assert.All(tokens, t => Assert.True(t.IsRevoked));
	}

	[Fact]
	public async Task RevokeAllUserTokensAsync_NoTokens_ReturnsZeroAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		TokenService service = CreateService(context);

		// Act
		int revokedCount =
			await service.RevokeAllUserTokensAsync(
				99999,
				CancellationToken.None);

		// Assert
		Assert.Equal(0, revokedCount);
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

		TokenService service =
			new(
				context,
				JwtOptions,
				limitedAuthOptions,
				timeProvider);

		// Act - Create tokens up to and beyond limit
		string firstToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"192.168.1.1",
				CancellationToken.None);

		string secondToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"192.168.1.2",
				CancellationToken.None);

		// This should trigger revocation of the oldest (first) token
		string thirdToken =
			await service.GenerateRefreshTokenAsync(
				user.Id,
				"192.168.1.3",
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

	[Fact]
	public async Task RotateRefreshTokenAsync_ReturnsNull_WhenTokenExpiredAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		string tokenValue = $"expired-rotate-{testId}";
		await using IdentityDbContext context = CreateIdentityDbContext();
		User user = await CreateTestUserAsync(context);

		RefreshToken expiredToken =
			new()
			{
				TokenHash = ComputeSha256Hash(tokenValue),
				UserId = user.Id,
				FamilyId = Guid.NewGuid(),
				ExpiresAt = FixedTime.AddDays(-1).UtcDateTime,
				CreateDate = FixedTime.AddDays(-8).UtcDateTime,
				IsRevoked = false
			};

		context.RefreshTokens.Add(expiredToken);
		await context.SaveChangesAsync();

		TokenService service = CreateService(context);

		// Act
		string? result =
			await service.RotateRefreshTokenAsync(
				tokenValue,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		Assert.Null(result);
	}

	#endregion

	#region Helper Methods

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