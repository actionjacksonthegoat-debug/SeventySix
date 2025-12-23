// <copyright file="ThirdPartyApiLimitSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Configuration for third-party API rate limits.
/// Bound from appsettings.json "ThirdPartyApiLimits" section.
/// </summary>
public record ThirdPartyApiLimitSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "ThirdPartyApiLimits";

	/// <summary>
	/// Default daily limit when API-specific limit not configured.
	/// </summary>
	public int DefaultDailyLimit { get; init; } = 1000;

	/// <summary>
	/// Master switch to enable/disable all third-party rate limiting.
	/// When false, rate limiting checks are bypassed (development mode).
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Per-API limit configurations.
	/// Key: API name (must match ExternalApiConstants values).
	/// </summary>
	public Dictionary<string, ThirdPartyApiLimit> Limits { get; init; } = [];

	/// <summary>
	/// Gets the configured daily limit for a specific API.
	/// Returns DefaultDailyLimit if API not explicitly configured.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// The daily limit for the API.
	/// </returns>
	public int GetDailyLimit(string apiName)
	{
		ThirdPartyApiLimit? config =
			Limits.GetValueOrDefault(apiName);

		return config?.DailyLimit ?? DefaultDailyLimit;
	}

	/// <summary>
	/// Checks if rate limiting is enabled for a specific API.
	/// Returns false if master Enabled is false OR API-specific Enabled is false.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// True if rate limiting should be enforced for this API.
	/// </returns>
	public bool IsApiRateLimitEnabled(string apiName)
	{
		if (!Enabled)
		{
			return false;
		}

		ThirdPartyApiLimit? config =
			Limits.GetValueOrDefault(apiName);

		return config?.Enabled ?? true;
	}
}

/// <summary>
/// Configuration for a specific third-party API limit.
/// </summary>
public record ThirdPartyApiLimit
{
	/// <summary>
	/// Daily request limit for this API.
	/// </summary>
	public int DailyLimit { get; init; } = 1000;

	/// <summary>
	/// Enable/disable rate limiting for this specific API.
	/// Useful for temporarily disabling limits during testing.
	/// </summary>
	public bool Enabled { get; init; } = true;
}