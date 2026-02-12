// <copyright file="MfaAttemptTracker.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using Microsoft.Extensions.Options;

namespace SeventySix.Identity;

/// <summary>
/// In-memory tracker for per-user MFA verification attempts.
/// Uses <see cref="MfaSettings.MaxAttempts"/> for the lockout threshold
/// and <see cref="MfaSettings.CodeExpirationMinutes"/> for the lockout window duration.
/// </summary>
///
/// <remarks>
/// This implementation uses a singleton <see cref="ConcurrentDictionary{TKey,TValue}"/>
/// and is NOT shared across multiple server instances. For horizontal scaling,
/// replace with a Valkey/Redis-backed implementation via <see cref="IMfaAttemptTracker"/>.
/// </remarks>
///
/// <param name="mfaSettings">
/// MFA configuration for attempt limits and lockout duration.
/// </param>
/// <param name="timeProvider">
/// Time provider for testable time-based expiry.
/// </param>
public sealed class MfaAttemptTracker(
	IOptions<MfaSettings> mfaSettings,
	TimeProvider timeProvider) : IMfaAttemptTracker
{
	private readonly ConcurrentDictionary<string, AttemptRecord> Attempts = new();

	/// <inheritdoc />
	public bool IsLockedOut(
		long userId,
		string attemptType)
	{
		string cacheKey =
			BuildKey(
				userId,
				attemptType);

		if (!Attempts.TryGetValue(
			cacheKey,
			out AttemptRecord? record))
		{
			return false;
		}

		if (IsExpired(record))
		{
			Attempts.TryRemove(
				cacheKey,
				out _);
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

		Attempts.AddOrUpdate(
			cacheKey,
			_ => new AttemptRecord(
				Count: 1,
				ExpiresAt: timeProvider.GetUtcNow().Add(lockoutWindow)),
			(_, existing) =>
			{
				if (IsExpired(existing))
				{
					return new AttemptRecord(
						Count: 1,
						ExpiresAt: timeProvider.GetUtcNow().Add(lockoutWindow));
				}

				return existing with { Count = existing.Count + 1 };
			});
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

		Attempts.TryRemove(
			cacheKey,
			out _);
	}

	/// <summary>
	/// Builds a cache key for the given user and attempt type.
	/// </summary>
	private static string BuildKey(
		long userId,
		string attemptType)
	{
		return $"{attemptType}_attempts:{userId}";
	}

	/// <summary>
	/// Checks whether the attempt record has expired.
	/// </summary>
	private bool IsExpired(AttemptRecord record)
	{
		return timeProvider.GetUtcNow() >= record.ExpiresAt;
	}

	/// <summary>
	/// Internal record tracking attempt count and expiry.
	/// </summary>
	private sealed record AttemptRecord(
		int Count,
		DateTimeOffset ExpiresAt);
}