// <copyright file="LoggingCacheKeys.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Provides consistent cache key generation for Logging domain.
/// </summary>
/// <remarks>
/// Cache key patterns follow the convention: logging:{entity}:{identifier}
/// This enables:
/// - Clear namespace separation by domain
/// - Pattern-based cache invalidation
/// - Easy debugging and monitoring in Valkey CLI
/// </remarks>
public static class LoggingCacheKeys
{
	/// <summary>
	/// Cache key prefix for Logging domain.
	/// </summary>
	private const string PREFIX = "logging";

	/// <summary>
	/// Generates a cache key for log entry count by level.
	/// </summary>
	/// <param name="level">
	/// The log level.
	/// </param>
	/// <returns>
	/// Cache key in format "logging:count:{level}".
	/// </returns>
	public static string CountByLevel(string level)
	{
		string sanitizedLevel =
			SanitizeKeySegment(level);
		return $"{PREFIX}:count:{sanitizedLevel}";
	}

	/// <summary>
	/// Generates a cache key for log statistics.
	/// </summary>
	/// <returns>
	/// Cache key "logging:statistics".
	/// </returns>
	public static string Statistics()
	{
		return $"{PREFIX}:statistics";
	}

	/// <summary>
	/// Sanitizes a value for use as a cache key segment.
	/// </summary>
	/// <param name="value">
	/// The value to sanitize.
	/// </param>
	/// <returns>
	/// Sanitized value safe for Redis keys.
	/// </returns>
	private static string SanitizeKeySegment(string value)
	{
		return value
			.Replace(":", "_")
			.Replace(" ", "_")
			.ToLowerInvariant();
	}
}
