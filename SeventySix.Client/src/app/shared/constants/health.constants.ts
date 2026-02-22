// <copyright file="health.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Health status constants matching server HealthStatusConstants.
 */

/** Healthy status - all checks passed. */
export const HEALTH_STATUS_HEALTHY: string = "Healthy";

/** Unhealthy status - critical check failed. */
export const HEALTH_STATUS_UNHEALTHY: string = "Unhealthy";

/** Degraded status - non-critical check failed. */
export const HEALTH_STATUS_DEGRADED: string = "Degraded";

/** Health status type union. */
export type HealthStatus = "Healthy" | "Unhealthy" | "Degraded";