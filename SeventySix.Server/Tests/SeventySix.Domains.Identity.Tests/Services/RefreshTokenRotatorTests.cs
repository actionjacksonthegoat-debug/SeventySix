// <copyright file="RefreshTokenRotatorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Integration tests for the refresh token rotation pipeline in <see cref="TokenService"/>.
/// Verifies the full rotation pipeline: happy-path rotation, expiry rejection,
/// absolute session timeout, and reuse-attack detection with family revocation.
/// </summary>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class RefreshTokenRotatorTests(IdentityPostgreSqlFixture fixture)
	: DataPostgreSqlTestBase(fixture)
{
	private static DateTimeOffset FixedTime =>
		TestTimeProviderBuilder.DefaultTime;

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
				AbsoluteSessionTimeoutDays = 30,
			});

	private IOptions<AuthSettings> AuthOptions =>
		Options.Create(
			new AuthSettings
			{
				Token =
					new TokenSettings { MaxActiveSessionsPerUser = 5 },
			});

	/// <summary>
	/// Creates a <see cref="TokenService"/> backed by a real database context
	/// and an optional <see cref="TimeProvider"/>.
	/// </summary>
	/// <param name="context">
	/// The EF Core context wired to the test PostgreSQL instance.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for deterministic date comparisons; defaults to fixed test time.
	/// </param>
	/// <returns>
	/// A fully-constructed <see cref="TokenService"/> ready for testing.
	/// </returns>
	private TokenService CreateService(
		IdentityDbContext context,
		TimeProvider? timeProvider = null)
	{
		TimeProvider tp =
			timeProvider ?? TestTimeProviderBuilder.CreateDefault();

		ITokenRepository tokenRepository =
			new TokenRepository(context);

		SessionManagementService sessionManagementService =
			new(
			tokenRepository,
			AuthOptions);

		return new TokenService(
			tokenRepository,
			sessionManagementService,
			JwtOptions,
			tp,
			NullLogger<TokenService>.Instance);
	}

	/// <summary>
	/// Verifies that presenting a valid, non-revoked refresh token returns a new
	/// non-null token and revokes the old one.
	/// </summary>
	[Fact]
	public async Task RotateRefreshTokenAsync_ValidToken_ReturnsNewTokenAndRevokesOldAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		FakeTimeProvider timeProvider =
			new(FixedTime);

		TokenService service =
			CreateService(context, timeProvider);

		ApplicationUser user =
			await CreateTestUserAsync(context);

		Guid familyId =
			Guid.NewGuid();

		string plainText =
			SeventySix.Shared.Extensions.CryptoExtensions.GenerateSecureToken();

		string tokenHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(plainText);

		RefreshToken original =
			new()
			{
				TokenHash = tokenHash,
				UserId = user.Id,
				FamilyId = familyId,
				ExpiresAt = FixedTime.AddDays(1),
				SessionStartedAt = FixedTime,
				CreateDate = FixedTime,
				IsRevoked = false,
			};

		context.Set<RefreshToken>().Add(original);
		await context.SaveChangesAsync(CancellationToken.None);

		// Act
		(string? Token, bool RememberMe) result =
			await service.RotateRefreshTokenAsync(
				plainText,
				CancellationToken.None);

		// Assert
		result.Token.ShouldNotBeNull();
		result.Token.ShouldNotBe(plainText);

		// Verify the old token was revoked in DB — use AsNoTracking to bypass EF cache
		RefreshToken? revokedToken =
			await context.RefreshTokens
				.AsNoTracking()
				.FirstOrDefaultAsync(
					t => t.TokenHash == original.TokenHash,
					CancellationToken.None);

		revokedToken.ShouldNotBeNull();
		revokedToken.IsRevoked.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies that a token past its expiry date is rejected with a null result.
	/// </summary>
	[Fact]
	public async Task RotateRefreshTokenAsync_ExpiredToken_ReturnsNullAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		FakeTimeProvider timeProvider =
			new(FixedTime);

		TokenService service =
			CreateService(context, timeProvider);

		ApplicationUser user =
			await CreateTestUserAsync(context);

		string plainText =
			SeventySix.Shared.Extensions.CryptoExtensions.GenerateSecureToken();

		string tokenHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(plainText);

		RefreshToken expired =
			new()
			{
				TokenHash = tokenHash,
				UserId = user.Id,
				FamilyId = Guid.NewGuid(),
				ExpiresAt = FixedTime.AddDays(-1),
				SessionStartedAt = FixedTime.AddDays(-2),
				CreateDate = FixedTime.AddDays(-2),
				IsRevoked = false,
			};

		context.Set<RefreshToken>().Add(expired);
		await context.SaveChangesAsync(CancellationToken.None);

		// Act
		(string? Token, bool RememberMe) result =
			await service.RotateRefreshTokenAsync(
				plainText,
				CancellationToken.None);

		// Assert
		result.Token.ShouldBeNull();
	}

	/// <summary>
	/// Verifies that a token whose session has exceeded the absolute session
	/// timeout is rejected and the token is revoked.
	/// </summary>
	[Fact]
	public async Task RotateRefreshTokenAsync_AbsoluteSessionTimeoutExceeded_ReturnsNullAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		// Advance time past the 30-day absolute session timeout
		FakeTimeProvider timeProvider =
			new(FixedTime.AddDays(31));

		TokenService service =
			CreateService(context, timeProvider);

		ApplicationUser user =
			await CreateTestUserAsync(context);

		string plainText =
			SeventySix.Shared.Extensions.CryptoExtensions.GenerateSecureToken();

		string tokenHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(plainText);

		RefreshToken token =
			new()
			{
				TokenHash = tokenHash,
				UserId = user.Id,
				FamilyId = Guid.NewGuid(),
				// Still valid by expiry, but session started 31 days ago
				ExpiresAt = FixedTime.AddDays(32),
				SessionStartedAt = FixedTime,
				CreateDate = FixedTime,
				IsRevoked = false,
			};

		context.Set<RefreshToken>().Add(token);
		await context.SaveChangesAsync(CancellationToken.None);

		// Act
		(string? Token, bool RememberMe) result =
			await service.RotateRefreshTokenAsync(
				plainText,
				CancellationToken.None);

		// Assert
		result.Token.ShouldBeNull();

		// Verify the token was revoked in DB — use AsNoTracking to bypass EF cache
		RefreshToken? revokedToken =
			await context.RefreshTokens
				.AsNoTracking()
				.FirstOrDefaultAsync(
					t => t.TokenHash == token.TokenHash,
					CancellationToken.None);

		revokedToken.ShouldNotBeNull();
		revokedToken.IsRevoked.ShouldBeTrue();
	}

	/// <summary>
	/// Verifies that presenting a revoked token triggers reuse-attack detection,
	/// which revokes all tokens in the same family and returns null.
	/// </summary>
	[Fact]
	public async Task RotateRefreshTokenAsync_RevokedToken_RevokesEntireFamilyAsync()
	{
		// Arrange
		await using IdentityDbContext context =
			CreateIdentityDbContext();

		FakeTimeProvider timeProvider =
			new(FixedTime);

		TokenService service =
			CreateService(context, timeProvider);

		ApplicationUser user =
			await CreateTestUserAsync(context);

		Guid familyId =
			Guid.NewGuid();

		string attackerToken =
			SeventySix.Shared.Extensions.CryptoExtensions.GenerateSecureToken();

		string attackerHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(attackerToken);

		// Already-revoked attacker token
		RefreshToken revoked =
			new()
			{
				TokenHash = attackerHash,
				UserId = user.Id,
				FamilyId = familyId,
				ExpiresAt = FixedTime.AddDays(1),
				SessionStartedAt = FixedTime,
				CreateDate = FixedTime,
				IsRevoked = true,
			};

		// Valid sibling in the same family (legitimate user's current token)
		string legitimateToken =
			SeventySix.Shared.Extensions.CryptoExtensions.GenerateSecureToken();

		string legitimateHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(legitimateToken);

		RefreshToken sibling =
			new()
			{
				TokenHash = legitimateHash,
				UserId = user.Id,
				FamilyId = familyId,
				ExpiresAt = FixedTime.AddDays(1),
				SessionStartedAt = FixedTime,
				CreateDate = FixedTime.AddMinutes(1),
				IsRevoked = false,
			};

		context.Set<RefreshToken>().AddRange(revoked, sibling);
		await context.SaveChangesAsync(CancellationToken.None);

		// Act — attacker presents the old revoked token
		(string? Token, bool RememberMe) result =
			await service.RotateRefreshTokenAsync(
				attackerToken,
				CancellationToken.None);

		// Assert — rotation rejected and sibling also revoked
		result.Token.ShouldBeNull();

		// Verify sibling was revoked in DB — use AsNoTracking to bypass EF cache
		RefreshToken? revokedSibling =
			await context.RefreshTokens
				.AsNoTracking()
				.FirstOrDefaultAsync(
					t => t.TokenHash == sibling.TokenHash,
					CancellationToken.None);

		revokedSibling.ShouldNotBeNull();
		revokedSibling.IsRevoked.ShouldBeTrue();
	}

	/// <summary>
	/// Creates a persisted <see cref="ApplicationUser"/> with a unique username and email
	/// for use in token rotation tests.
	/// </summary>
	/// <param name="context">
	/// The EF Core context to persist the user into.
	/// </param>
	/// <returns>
	/// The saved <see cref="ApplicationUser"/>.
	/// </returns>
	private async Task<ApplicationUser> CreateTestUserAsync(IdentityDbContext context)
	{
		FakeTimeProvider timeProvider =
			new(FixedTime);

		string uniqueId =
			Guid.NewGuid().ToString("N");

		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername($"rotatortest_{uniqueId}")
				.WithEmail($"rotator_{uniqueId}@example.com")
				.WithIsActive(true)
				.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		return user;
	}
}