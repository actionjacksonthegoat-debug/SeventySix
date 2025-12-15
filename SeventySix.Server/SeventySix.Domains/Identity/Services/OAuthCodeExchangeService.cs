// <copyright file="OAuthCodeExchangeService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace SeventySix.Identity;

/// <summary>
/// Implements secure OAuth code exchange pattern using memory cache.
/// </summary>
/// <remarks>
/// Security Design:
/// - Codes are cryptographically random (32 bytes, base64url encoded)
/// - 60 second TTL prevents replay attacks
/// - One-time use: code removed from cache after exchange
/// - Memory-only: codes never persisted to disk/database
/// </remarks>
public class OAuthCodeExchangeService(IMemoryCache cache)
	: IOAuthCodeExchangeService
{
	/// <summary>
	/// Cache key prefix for OAuth codes.
	/// </summary>
	private const string CacheKeyPrefix = "oauth_code_";

	/// <summary>
	/// Code expiration time in seconds.
	/// </summary>
	private const int CodeExpirationSeconds = 60;

	/// <inheritdoc/>
	public string StoreTokens(
		string accessToken,
		string refreshToken,
		DateTime expiresAt)
	{
		string code = GenerateSecureCode();

		OAuthCodeExchangeResult tokenData =
			new(
				accessToken,
				refreshToken,
				expiresAt);

		MemoryCacheEntryOptions options =
			new MemoryCacheEntryOptions()
				.SetAbsoluteExpiration(TimeSpan.FromSeconds(CodeExpirationSeconds))
				.SetPriority(CacheItemPriority.High);

		cache.Set($"{CacheKeyPrefix}{code}", tokenData, options);

		return code;
	}

	/// <inheritdoc/>
	public OAuthCodeExchangeResult? ExchangeCode(string code)
	{
		string cacheKey =
			$"{CacheKeyPrefix}{code}";

		if (
			!cache.TryGetValue(cacheKey, out OAuthCodeExchangeResult? tokenData))
		{
			return null;
		}

		// One-time use: remove immediately after retrieval
		cache.Remove(cacheKey);

		return tokenData;
	}

	/// <summary>
	/// Generates a cryptographically secure random code.
	/// </summary>
	/// <returns>Base64url encoded random code.</returns>
	private static string GenerateSecureCode()
	{
		byte[] bytes =
			RandomNumberGenerator.GetBytes(32);

		// Base64url encoding (no padding, URL-safe)
		return Convert
			.ToBase64String(bytes)
			.Replace("+", "-")
			.Replace("/", "_")
			.TrimEnd('=');
	}
}
