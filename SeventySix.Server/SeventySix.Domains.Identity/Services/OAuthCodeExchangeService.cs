// <copyright file="OAuthCodeExchangeService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Buffers.Text;
using System.Security.Cryptography;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Implements secure OAuth code exchange pattern using FusionCache.
/// </summary>
/// <remarks>
/// Security Design:
/// - Codes are cryptographically random (32 bytes, base64url encoded)
/// - 60 second TTL prevents replay attacks
/// - One-time use: code removed from cache after exchange
/// - Memory-only: codes never distributed (SetSkipDistributedCache)
/// </remarks>
public sealed class OAuthCodeExchangeService : IOAuthCodeExchangeService
{
	/// <summary>
	/// Cache key prefix for OAuth codes.
	/// </summary>
	private const string CacheKeyPrefix = "oauth_code_";

	/// <summary>
	/// The identity domain cache.
	/// </summary>
	private readonly IFusionCache IdentityCache;

	/// <summary>
	/// Initializes a new instance of the <see cref="OAuthCodeExchangeService"/> class.
	/// </summary>
	/// <param name="cacheProvider">
	/// The FusionCache provider for named cache access.
	/// </param>
	public OAuthCodeExchangeService(IFusionCacheProvider cacheProvider)
	{
		IdentityCache =
			cacheProvider.GetCache(CacheNames.Identity);
	}

	/// <inheritdoc/>
	public string StoreTokens(
		string accessToken,
		string refreshToken,
		DateTime expiresAt,
		string email,
		string? fullName,
		bool requiresPasswordChange)
	{
		string code =
			GenerateSecureCode();

		OAuthCodeExchangeResult tokenData =
			new(
				accessToken,
				refreshToken,
				expiresAt,
				email,
				fullName,
				requiresPasswordChange);

		// Memory-only for OAuth codes: short-lived, security-sensitive
		IdentityCache.Set(
			$"{CacheKeyPrefix}{code}",
			tokenData,
			options =>
			{
				options.Duration =
					TimeSpan.FromSeconds(TimeoutConstants.OAuth.CodeExchangeTtlSeconds);
				options.SkipDistributedCacheWrite =
					true;
				options.SkipBackplaneNotifications =
					true;
			});

		return code;
	}

	/// <inheritdoc/>
	public OAuthCodeExchangeResult? ExchangeCode(string code)
	{
		string cacheKey =
			$"{CacheKeyPrefix}{code}";

		OAuthCodeExchangeResult? tokenData =
			IdentityCache.GetOrDefault<OAuthCodeExchangeResult>(cacheKey);

		if (tokenData is not null)
		{
			// One-time use: remove immediately after retrieval
			IdentityCache.Remove(cacheKey);
		}

		return tokenData;
	}

	/// <summary>
	/// Generates a cryptographically secure random code.
	/// </summary>
	/// <returns>
	/// Base64url encoded random code.
	/// </returns>
	private static string GenerateSecureCode()
	{
		byte[] bytes =
			RandomNumberGenerator.GetBytes(32);

		return Base64Url.EncodeToString(bytes);
	}
}