// <copyright file="ThirdPartyApiLimitSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Enums;

namespace SeventySix.Shared;

/// <summary>
/// Configuration for third-party API rate limits.
/// Bound from appsettings.json "ThirdPartyApiLimits" section.
/// </summary>
public record ThirdPartyApiLimitSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "ThirdPartyApiLimits";

	/// <summary>
	/// Gets the default daily limit when API-specific limit not configured.
	/// </summary>
	public int DefaultDailyLimit { get; init; } = 1000;

	/// <summary>
	/// Gets the default monthly limit when API-specific limit not configured.
	/// </summary>
	public int DefaultMonthlyLimit { get; init; } = 30000;

	/// <summary>
	/// Gets a value indicating whether rate limiting is enabled globally.
	/// When false, rate limiting checks are bypassed (development mode).
	/// </summary>
	public bool Enabled { get; init; } = true;

	/// <summary>
	/// Gets the per-API limit configurations.
	/// Key: API name (must match ExternalApiConstants values).
	/// </summary>
	public Dictionary<string, ThirdPartyApiLimit> Limits { get; init; } = [];

	/// <summary>
	/// Gets the configured limit for a specific API based on its interval.
	/// Returns appropriate default if API not explicitly configured.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// The limit value for the API.
	/// </returns>
	public int GetLimit(string apiName)
	{
		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		if (apiLimit is null)
		{
			return DefaultDailyLimit;
		}

		return apiLimit.Interval switch
		{
			LimitInterval.Monthly => apiLimit.MonthlyLimit ?? DefaultMonthlyLimit,
			_ => apiLimit.DailyLimit ?? DefaultDailyLimit
		};
	}

	/// <summary>
	/// Gets the limit interval for a specific API.
	/// Returns Daily if API not explicitly configured.
	/// </summary>
	/// <param name="apiName">
	/// The API name from ExternalApiConstants.
	/// </param>
	/// <returns>
	/// The limit interval for the API.
	/// </returns>
	public LimitInterval GetLimitInterval(string apiName)
	{
		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		return apiLimit?.Interval ?? LimitInterval.Daily;
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

		ThirdPartyApiLimit? apiLimit =
			Limits.GetValueOrDefault(apiName);

		return apiLimit?.Enabled ?? true;
	}
}

/// <summary>
/// Configuration for a specific third-party API limit.
/// Supports both daily and monthly intervals.
/// </summary>
public record ThirdPartyApiLimit
{
	/// <summary>
	/// Gets the interval type for this limit (Daily or Monthly).
	/// Default is Daily for backward compatibility.
	/// </summary>
	public LimitInterval Interval { get; init; } = LimitInterval.Daily;

	/// <summary>
	/// Gets the daily request limit for this API.
	/// Used when Interval is Daily.
	/// </summary>
	public int? DailyLimit { get; init; }

	/// <summary>
	/// Gets the monthly request limit for this API.
	/// Used when Interval is Monthly. Resets on 1st of month at midnight UTC.
	/// </summary>
	public int? MonthlyLimit { get; init; }

	/// <summary>
	/// Gets a value indicating whether rate limiting is enabled for this API.
	/// Useful for temporarily disabling limits during testing.
	/// </summary>
	public bool Enabled { get; init; } = true;
}