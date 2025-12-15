/**
 * Permission requests models barrel export.
 * Re-exports cross-domain DTOs from integration.
 */

// Re-export cross-domain permission types from integration
export type {
	AvailableRoleDto,
	CreatePermissionRequestDto,
	PermissionRequestDto
} from "@integration/account-admin";
