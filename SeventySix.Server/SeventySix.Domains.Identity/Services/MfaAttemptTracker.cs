// <copyright file="MfaAttemptTracker.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Distributed tracker for per-user MFA verification attempts.
/// Uses <see cref="MfaSettings.MaxAttempts"/> for the lockout threshold
/// and <see cref="MfaSettings.CodeExpirationMinutes"/> for the lockout window duration.
/// </summary>
/// <remarks>
/// Backed by the Identity <see cref="IFusionCache"/> (memory L1 + Valkey L2 in production),
/// this implementation is safe for horizontal deployment: attempt counts are visible to every
/// API replica sharing the distributed cache. Tests inject a memory-only cache.
/// </remarks>
///
/// <param name="cacheProvider">
/// FusionCache provider used to resolve the Identity named cache.
/// </param>
/// <param name="mfaSettings">
/// MFA configuration for attempt limits and lockout duration.
/// </param>
/// <param name="timeProvider">
/// Time provider for deterministic expiry under test.
/// </param>
public sealed class MfaAttemptTracker(
	IFusionCacheProvider cacheProvider,
	IOptions<MfaSettings> mfaSettings,
	TimeProvider timeProvider) : IMfaAttemptTracker
{
	/// <summary>
	/// Cache key prefix — keeps MFA attempt entries namespaced away from
	/// other Identity cache consumers (OAuth codes, session data, etc.).
	/// </summary>
	private const string CacheKeyPrefix = "mfa:attempt:";

	/// <summary>
	/// The Identity domain cache (memory + distributed).
	/// </summary>
	private readonly IFusionCache IdentityCache =
		cacheProvider.GetCache(CacheNames.Identity);

	/// <inheritdoc />
	public bool IsLockedOut(
		long userId,
		string attemptType)
	{
		string cacheKey =
			BuildKey(
				userId,
				attemptType);

		AttemptRecord? record =
			IdentityCache.GetOrDefault<AttemptRecord?>(cacheKey);

		if (record is null)
		{
			return false;
		}

		if (IsExpired(record))
		{
			IdentityCache.Remove(cacheKey);
			return false;
		}

		return record.Count >= mfaSettings.Value.MaxAttempts;
	}

	/// <inheritdoc />
	public void RecordFailedAttempt(
		long userId,
		string attemptType)
	{
		string cacheKey =
			BuildKey(
				userId,
				attemptType);

		TimeSpan lockoutWindow =
			TimeSpan.FromMinutes(
				mfaSettings.Value.CodeExpirationMinutes);

		AttemptRecord? existing =
			IdentityCache.GetOrDefault<AttemptRecord?>(cacheKey);

		AttemptRecord updated =
			existing is null || IsExpired(existing)
				? new AttemptRecord(
					Count: 1,
					ExpiresAt: timeProvider.GetUtcNow().Add(lockoutWindow))
				: existing with { Count = existing.Count + 1 };

		IdentityCache.Set(
			cacheKey,
			updated,
			options => options.Duration = lockoutWindow);
	}

	/// <inheritdoc />
	public void ResetAttempts(
		long userId,
		string attemptType)
	{
		string cacheKey =
			BuildKey(
				userId,
				attemptType);

		IdentityCache.Remove(cacheKey);
	}

	/// <summary>
	/// Builds a cache key for the given user and attempt type.
	/// </summary>
	/// <param name="userId">
	/// The user whose attempts are tracked.
	/// </param>
	/// <param name="attemptType">
	/// The MFA attempt type (e.g., "totp", "backup").
	/// </param>
	/// <returns>
	/// The namespaced cache key.
	/// </returns>
	private static string BuildKey(
		long userId,
		string attemptType)
	{
		return $"{CacheKeyPrefix}{attemptType}:{userId}";
	}

	/// <summary>
	/// Checks whether the attempt record has expired per the current time provider.
	/// </summary>
	/// <param name="record">
	/// The persisted attempt record.
	/// </param>
	/// <returns>
	/// True when the record's expiry is at or before the current instant.
	/// </returns>
	private bool IsExpired(AttemptRecord record)
	{
		return timeProvider.GetUtcNow() >= record.ExpiresAt;
	}

	/// <summary>
	/// Internal record tracking attempt count and expiry timestamp.
	/// </summary>
	/// <param name="Count">
	/// Number of failed attempts recorded in the active window.
	/// </param>
	/// <param name="ExpiresAt">
	/// Instant after which the record is considered stale.
	/// </param>
	public sealed record AttemptRecord(
		int Count,
		DateTimeOffset ExpiresAt);
}