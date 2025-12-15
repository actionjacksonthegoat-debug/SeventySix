/**
 * Shared API DTOs - types used by shared/ services.
 * These are the only DTOs that belong in shared/models.
 * Domain-specific DTOs should be in their domain's models/index.ts.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Auth types - used by AuthService (shared)
export type LoginRequest = components["schemas"]["LoginRequest"];
export type AuthResponse = components["schemas"]["AuthResponse"];
export type UserProfileDto = components["schemas"]["UserProfileDto"];

// Error logging types - used by ClientErrorLoggerService, LoggerService (shared)
export type CreateLogRequest =
	& Omit<
		components["schemas"]["CreateLogRequest"],
		"additionalContext" | "statusCode">
	& {
		additionalContext?: Record<string, unknown> | null;
		statusCode?: number | null;
	};

// Error handling - used app-wide
export type ProblemDetails = components["schemas"]["ProblemDetails"];
