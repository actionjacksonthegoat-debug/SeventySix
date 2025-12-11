/**
 * Type-safe API client using generated OpenAPI types.
 * Provides compile-time type safety for all API requests/responses.
 *
 * Generated types are auto-generated from the OpenAPI spec.
 * Run `npm run gen:api` to regenerate types after API changes.
 */

import { components } from "./generated-api";

/**
 * Re-export commonly used generated types for convenience.
 * These types are auto-generated from C# DTOs - never manually edit.
 */

// Auth types
export type LoginRequest = components["schemas"]["LoginRequest"];
export type RegisterRequest = components["schemas"]["RegisterRequest"];
export type AuthResponse = components["schemas"]["AuthResponse"];
export type UserProfileDto = components["schemas"]["UserProfileDto"];
export type OAuthCodeExchangeRequest =
	components["schemas"]["OAuthCodeExchangeRequest"];
export type ChangePasswordRequest = components["schemas"]["ChangePasswordRequest"];
export type ForgotPasswordRequest = components["schemas"]["ForgotPasswordRequest"];
export type InitiateRegistrationRequest =
	components["schemas"]["InitiateRegistrationRequest"];
export type CompleteRegistrationRequest =
	components["schemas"]["CompleteRegistrationRequest"];
export type SetPasswordRequest = components["schemas"]["SetPasswordRequest"];

// User types
export type UserDto = Omit<
	components["schemas"]["UserDto"],
	"id" | "statusCode"
> & {
	id: number;
	statusCode?: number | null;
};
export type CreateUserRequest = components["schemas"]["CreateUserRequest"];
export type UpdateUserRequest = Omit<
	components["schemas"]["UpdateUserRequest"],
	"id"
> & {
	id: number;
};
export type UpdateProfileRequest = components["schemas"]["UpdateProfileRequest"];

// Log types
export type LogDto = Omit<
	components["schemas"]["LogDto"],
	"id" | "statusCode" | "durationMs"
> & {
	id: number;
	statusCode?: number | null;
	durationMs?: number | null;
};
export type CreateLogRequest = Omit<
	components["schemas"]["CreateLogRequest"],
	"additionalContext" | "statusCode"
> & {
	additionalContext?: Record<string, unknown> | null;
	statusCode?: number | null;
};

// Common types
export type ProblemDetails = components["schemas"]["ProblemDetails"];
export type PagedResultOfLogDto = Omit<
	components["schemas"]["PagedResultOfLogDto"],
	"page" | "pageSize" | "totalCount" | "totalPages"
> & {
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
};
export type PagedResultOfUserDto = Omit<
	components["schemas"]["PagedResultOfUserDto"],
	"page" | "pageSize" | "totalCount" | "totalPages"
> & {
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
};
export type AvailableRoleDto = components["schemas"]["AvailableRoleDto"];
export type CreatePermissionRequestDto =
	components["schemas"]["CreatePermissionRequestDto"];
export type PermissionRequestDto = Omit<
	components["schemas"]["PermissionRequestDto"],
	"id"
> & { id: number };

// Health types
export type HealthStatusResponse =
	components["schemas"]["HealthStatusResponse"];
export type DatabaseHealthResponse =
	components["schemas"]["DatabaseHealthResponse"];
export type ExternalApiHealthResponse =
	components["schemas"]["ExternalApiHealthResponse"];
export type ApiHealthStatus =
	components["schemas"]["ApiHealthStatus"];
export type QueueHealthResponse =
	components["schemas"]["QueueHealthResponse"];
export type SystemResourcesResponse =
	components["schemas"]["SystemResourcesResponse"];

// Third-party API types
export type ThirdPartyApiRequestResponse =
	components["schemas"]["ThirdPartyApiRequestResponse"];
export type ThirdPartyApiStatisticsResponse =
	components["schemas"]["ThirdPartyApiStatisticsResponse"];
