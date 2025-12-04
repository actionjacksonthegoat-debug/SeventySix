// <copyright file="HealthStatusConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for health check status values.
/// </summary>
/// <remarks>
/// Used in health check responses for API health endpoints.
/// </remarks>
public static class HealthStatusConstants
{
	/// <summary>
	/// Indicates all health checks passed.
	/// </summary>
	public const string Healthy = "Healthy";

	/// <summary>
	/// Indicates system is operational but with issues.
	/// </summary>
	public const string Degraded = "Degraded";

	/// <summary>
	/// Indicates system is not operational.
	/// </summary>
	public const string Unhealthy = "Unhealthy";
}
