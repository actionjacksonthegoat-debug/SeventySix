// <copyright file="HealthCheckNameConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for health check names.
/// Single source of truth for health check registration and querying (DRY).
/// </summary>
public static class HealthCheckNameConstants
{
	/// <summary>
	/// Identity domain health check.
	/// </summary>
	public const string Identity = "identity";

	/// <summary>
	/// Logging domain health check.
	/// </summary>
	public const string Logging = "logging";

	/// <summary>
	/// API Tracking domain health check.
	/// </summary>
	public const string ApiTracking = "api-tracking";

	/// <summary>
	/// Valkey (Redis) cache health check.
	/// </summary>
	public const string Valkey = "valkey";

	/// <summary>
	/// Jaeger tracing health check.
	/// </summary>
	public const string Jaeger = "jaeger";

	/// <summary>
	/// Email service health check.
	/// </summary>
	public const string Email = "email";
}