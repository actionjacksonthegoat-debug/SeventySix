// <copyright file="RefreshTokenBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using SeventySix.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Fluent builder for creating RefreshToken entities in tests.
/// </summary>
/// <remarks>
/// Provides a convenient way to create RefreshToken entities with default test values.
/// Automatically handles token hashing for realistic test scenarios.
///
/// Usage:
/// <code>
/// RefreshToken token = new RefreshTokenBuilder(timeProvider)
///     .WithUserId(userId)
///     .WithRememberMe(true)
///     .Build();
/// </code>
/// </remarks>
public class RefreshTokenBuilder
{
	private readonly TimeProvider TimeProvider;
	private long UserId = 1;
	private string PlainToken =
		Guid.NewGuid().ToString("N");
	private Guid FamilyId =
		Guid.NewGuid();
	private string CreatedByIp = "127.0.0.1";
	private bool IsRevoked = false;
	private DateTime? RevokedAt = null;
	private bool RememberMe = false;
	private DateTime? CustomExpiresAt = null;
	private DateTime? CustomSessionStartedAt = null;

	/// <summary>
	/// Initializes a new instance of the <see cref="RefreshTokenBuilder"/> class.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider for default timestamps.
	/// </param>
	public RefreshTokenBuilder(TimeProvider timeProvider)
	{
		TimeProvider = timeProvider;
	}

	/// <summary>
	/// Sets the user ID for the refresh token.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithUserId(long userId)
	{
		UserId = userId;
		return this;
	}

	/// <summary>
	/// Sets the plaintext token value.
	/// This will be hashed when building the entity.
	/// </summary>
	/// <param name="plainToken">
	/// The plaintext token string.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithPlainToken(string plainToken)
	{
		PlainToken = plainToken;
		return this;
	}

	/// <summary>
	/// Sets the token family ID for tracking token rotation chains.
	/// </summary>
	/// <param name="familyId">
	/// The family identifier.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithFamilyId(Guid familyId)
	{
		FamilyId = familyId;
		return this;
	}

	/// <summary>
	/// Sets the IP address that created this token.
	/// </summary>
	/// <param name="ipAddress">
	/// The client IP address.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithCreatedByIp(string ipAddress)
	{
		CreatedByIp = ipAddress;
		return this;
	}

	/// <summary>
	/// Marks the token as revoked.
	/// </summary>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder AsRevoked()
	{
		IsRevoked = true;
		RevokedAt =
			TimeProvider.GetUtcNow().UtcDateTime;
		return this;
	}

	/// <summary>
	/// Sets the remember me flag for extended expiration.
	/// </summary>
	/// <param name="rememberMe">
	/// Whether to use extended expiration.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithRememberMe(bool rememberMe = true)
	{
		RememberMe = rememberMe;
		return this;
	}

	/// <summary>
	/// Sets a custom expiration date.
	/// </summary>
	/// <param name="expiresAt">
	/// The custom expiration date.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithExpiresAt(DateTime expiresAt)
	{
		CustomExpiresAt = expiresAt;
		return this;
	}

	/// <summary>
	/// Sets a custom session start date.
	/// </summary>
	/// <param name="sessionStartedAt">
	/// The custom session start date.
	/// </param>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder WithSessionStartedAt(DateTime sessionStartedAt)
	{
		CustomSessionStartedAt = sessionStartedAt;
		return this;
	}

	/// <summary>
	/// Creates an expired token (expires 1 second ago).
	/// </summary>
	/// <returns>
	/// The builder instance for method chaining.
	/// </returns>
	public RefreshTokenBuilder AsExpired()
	{
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;
		CustomExpiresAt =
			now.AddSeconds(-1);
		return this;
	}

	/// <summary>
	/// Builds the RefreshToken entity.
	/// </summary>
	/// <returns>
	/// A configured RefreshToken instance with hashed token.
	/// </returns>
	public RefreshToken Build()
	{
		DateTime now =
			TimeProvider.GetUtcNow().UtcDateTime;

		int expirationDays =
			RememberMe
				? JwtConstants.DefaultRefreshTokenRememberMeExpirationDays
				: JwtConstants.DefaultRefreshTokenExpirationDays;

		DateTime expiresAt =
			CustomExpiresAt ?? now.AddDays(expirationDays);

		DateTime sessionStartedAt =
			CustomSessionStartedAt ?? now;

		return new RefreshToken
		{
			UserId = UserId,
			TokenHash = HashToken(PlainToken),
			FamilyId = FamilyId,
			CreateDate = now,
			CreatedByIp = CreatedByIp,
			ExpiresAt = expiresAt,
			SessionStartedAt = sessionStartedAt,
			IsRevoked = IsRevoked,
			RevokedAt = RevokedAt,
		};
	}

	/// <summary>
	/// Builds the RefreshToken entity and returns the plaintext token.
	/// Use this when you need to test token validation.
	/// </summary>
	/// <param name="plainToken">
	/// Output parameter containing the plaintext token.
	/// </param>
	/// <returns>
	/// A configured RefreshToken instance with hashed token.
	/// </returns>
	public RefreshToken BuildWithPlainToken(out string plainToken)
	{
		plainToken = PlainToken;
		return Build();
	}

	/// <summary>
	/// Hashes a token using SHA256 (matches TokenService implementation).
	/// </summary>
	/// <param name="token">
	/// The plaintext token.
	/// </param>
	/// <returns>
	/// The hashed token as a hex string.
	/// </returns>
	private static string HashToken(string token)
	{
		byte[] bytes =
			SHA256.HashData(
				System.Text.Encoding.UTF8.GetBytes(token));
		return Convert.ToHexString(bytes);
	}
}
