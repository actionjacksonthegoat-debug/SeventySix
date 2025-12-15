/**
 * Admin dashboard models barrel export.
 * Re-exports generated DTOs from generated-open-api
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Health types
export type HealthStatusResponse = components["schemas"]["HealthStatusResponse"];
export type DatabaseHealthResponse = components["schemas"]["DatabaseHealthResponse"];
export type ExternalApiHealthResponse = components["schemas"]["ExternalApiHealthResponse"];
export type ApiHealthStatus = components["schemas"]["ApiHealthStatus"];
export type QueueHealthResponse = components["schemas"]["QueueHealthResponse"];
export type SystemResourcesResponse = components["schemas"]["SystemResourcesResponse"];

// Third-party API types
export type ThirdPartyApiRequestResponse = components["schemas"]["ThirdPartyApiRequestResponse"];
export type ThirdPartyApiStatisticsResponse = components["schemas"]["ThirdPartyApiStatisticsResponse"];
