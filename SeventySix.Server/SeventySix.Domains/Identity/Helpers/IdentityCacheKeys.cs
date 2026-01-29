// <copyright file="IdentityCacheKeys.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Provides consistent cache key generation for Identity domain.
/// </summary>
/// <remarks>
/// Cache key patterns follow the convention: identity:{entity}:{identifier}
/// This enables:
/// - Clear namespace separation by domain
/// - Pattern-based cache invalidation (e.g., invalidate all "identity:user:*")
/// - Easy debugging and monitoring in Valkey CLI
/// </remarks>
public static class IdentityCacheKeys
{
	/// <summary>
	/// Cache key prefix for Identity domain.
	/// </summary>
	private const string PREFIX = "identity";

	/// <summary>
	/// Generates a cache key for a user lookup by ID.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// Cache key in format "identity:user:{userId}".
	/// </returns>
	public static string UserById(long userId)
	{
		return $"{PREFIX}:user:{userId}";
	}

	/// <summary>
	/// Generates a cache key for a user profile lookup.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// Cache key in format "identity:profile:{userId}".
	/// </returns>
	public static string UserProfile(long userId)
	{
		return $"{PREFIX}:profile:{userId}";
	}

	/// <summary>
	/// Generates a cache key for available roles for a specific user.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// Cache key in format "identity:available-roles:{userId}".
	/// </returns>
	public static string AvailableRoles(long userId)
	{
		return $"{PREFIX}:available-roles:{userId}";
	}

	/// <summary>
	/// Generates a cache key for a user's assigned roles.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <returns>
	/// Cache key in format "identity:user-roles:{userId}".
	/// </returns>
	public static string UserRoles(long userId)
	{
		return $"{PREFIX}:user-roles:{userId}";
	}

	/// <summary>
	/// Generates a cache key for permission requests list.
	/// </summary>
	/// <returns>
	/// Cache key "identity:permission-requests".
	/// </returns>
	public static string PermissionRequests()
	{
		return $"{PREFIX}:permission-requests";
	}

	/// <summary>
	/// Generates a cache key for all users list.
	/// </summary>
	/// <returns>
	/// Cache key "identity:all-users".
	/// </returns>
	public static string AllUsers()
	{
		return $"{PREFIX}:all-users";
	}

	/// <summary>
	/// Generates a cache key for user lookup by email.
	/// </summary>
	/// <param name="email">
	/// The email address.
	/// </param>
	/// <returns>
	/// Cache key in format "identity:user:email:{sanitized}".
	/// </returns>
	public static string UserByEmail(string email)
	{
		string sanitizedEmail =
			SanitizeKeySegment(email);
		return $"{PREFIX}:user:email:{sanitizedEmail}";
	}

	/// <summary>
	/// Generates a cache key for user lookup by username.
	/// </summary>
	/// <param name="username">
	/// The username.
	/// </param>
	/// <returns>
	/// Cache key in format "identity:user:username:{sanitized}".
	/// </returns>
	public static string UserByUsername(string username)
	{
		string sanitizedUsername =
			SanitizeKeySegment(username);
		return $"{PREFIX}:user:username:{sanitizedUsername}";
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