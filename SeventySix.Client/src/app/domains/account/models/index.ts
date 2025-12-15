import { components } from "@shared/generated-open-api/generated-open-api";

// User profile DTOs
export type UpdateProfileRequest = components["schemas"]["UpdateProfileRequest"];
export type UserProfileDto = components["schemas"]["UserProfileDto"];

// Re-export cross-domain permission types from integration
export type {
	AvailableRoleDto,
	CreatePermissionRequestDto
} from "@integration/account-admin";
