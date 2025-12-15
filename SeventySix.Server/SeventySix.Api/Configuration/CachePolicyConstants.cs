// <copyright file="CachePolicyConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Constants for output cache policy names.
/// Centralizes policy names to avoid magic strings in controllers and configuration.
/// </summary>
/// <remarks>
/// Usage:
/// - Controllers: [OutputCache(PolicyName = CachePolicyConstants.Users)]
/// - Configuration: Maps to "Cache:OutputCache:Policies:users" in appsettings.json
/// </remarks>
public static class CachePolicyConstants
{
	/// <summary>Cache policy for user-related endpoints.</summary>
	public const string Users = "users";

	/// <summary>Cache policy for log-related endpoints.</summary>
	public const string Logs = "logs";

	/// <summary>Cache policy for health check endpoints.</summary>
	public const string Health = "health";

	/// <summary>Cache policy for third-party API request tracking endpoints.</summary>
	public const string ThirdPartyRequests = "thirdpartyrequests";
}
