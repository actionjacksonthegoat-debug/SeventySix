// <copyright file="HealthCheckThresholds.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Threshold constants for health check evaluations.
/// Single source of truth for health status determination (DRY).
/// </summary>
public static class HealthCheckThresholds
{
	/// <summary>
	/// Number of failed queue items that triggers an unhealthy status.
	/// </summary>
	public const int UnhealthyFailedItemCount = 10;

	/// <summary>
	/// Number of queued items that triggers a degraded status.
	/// </summary>
	public const int DegradedQueuedItemCount = 50;
}
