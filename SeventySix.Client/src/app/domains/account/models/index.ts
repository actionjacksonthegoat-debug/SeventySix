import { components } from "@shared/generated-open-api/generated-open-api";

// User profile DTOs
/**
 * Request payload used to update the current user's profile.
 * Mirrors the `UpdateProfileRequest` schema from the generated OpenAPI types.
 */
export type UpdateProfileRequest = components["schemas"]["UpdateProfileRequest"];

/**
 * Data transfer object representing a user's profile returned by the API.
 * Mirrors the `UserProfileDto` schema from the generated OpenAPI types.
 */
export type UserProfileDto = components["schemas"]["UserProfileDto"];

// Permission-related types from generated OpenAPI
/**
 * Data transfer object representing a role available for request.
 * Mirrors the `AvailableRoleDto` schema from the generated OpenAPI types.
 */
export type AvailableRoleDto = components["schemas"]["AvailableRoleDto"];

/**
 * Request payload used to create a permission request.
 * Mirrors the `CreatePermissionRequestDto` schema from the generated OpenAPI types.
 */
export type CreatePermissionRequestDto = components["schemas"]["CreatePermissionRequestDto"];