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

// Re-export cross-domain permission types from integration
/**
 * Permission-related types re-exported from the account-admin integration.
 * Includes `AvailableRoleDto` and `CreatePermissionRequestDto`.
 */
export type {
	AvailableRoleDto,
	CreatePermissionRequestDto
} from "@integration/account-admin";
