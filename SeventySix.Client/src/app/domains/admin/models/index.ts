/**
 * Admin dashboard models barrel export.
 * Re-exports generated DTOs from generated-open-api
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Health types
/**
 * Health status response for overall service health checks.
 * Mirrors the generated `HealthStatusResponse` schema.
 */
export type HealthStatusResponse = components["schemas"]["HealthStatusResponse"];

/**
 * Database health details for a single database instance.
 * Mirrors the generated `DatabaseHealthResponse` schema.
 */
export type DatabaseHealthResponse = components["schemas"]["DatabaseHealthResponse"];

/**
 * External API health response for downstream services.
 * Mirrors the generated `ExternalApiHealthResponse` schema.
 */
export type ExternalApiHealthResponse = components["schemas"]["ExternalApiHealthResponse"];

/**
 * Aggregate API health status (e.g., Up/Down/Degraded).
 * Mirrors the generated `ApiHealthStatus` schema.
 */
export type ApiHealthStatus = components["schemas"]["ApiHealthStatus"];

/**
 * Queue health response for message queue systems.
 * Mirrors the generated `QueueHealthResponse` schema.
 */
export type QueueHealthResponse = components["schemas"]["QueueHealthResponse"];

/**
 * System resources snapshot (CPU, memory, disk) used for diagnostics.
 * Mirrors the generated `SystemResourcesResponse` schema.
 */
export type SystemResourcesResponse = components["schemas"]["SystemResourcesResponse"];

/**
 * Response containing status information for a recurring background job.
 * Mirrors the generated `RecurringJobStatusResponse` schema.
 */
export type RecurringJobStatusResponse = components["schemas"]["RecurringJobStatusResponse"];

// Third-party API types
/**
 * Response describing a third-party API request entry.
 * Mirrors the generated `ThirdPartyApiRequestResponse` schema.
 */
export type ThirdPartyApiRequestResponse = components["schemas"]["ThirdPartyApiRequestResponse"];

/**
 * Aggregated statistics for third-party API usage.
 * Mirrors the generated `ThirdPartyApiStatisticsResponse` schema.
 */
export type ThirdPartyApiStatisticsResponse = components["schemas"]["ThirdPartyApiStatisticsResponse"];
