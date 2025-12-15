/**
 * Account-Admin Integration API barrel export.
 *
 * These DTOs are used by BOTH Account and Admin domains:
 * - Account: User requests permissions for themselves
 * - Admin: Admins manage/approve permission requests
 *
 * Cross-domain features use integration layer.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

// Re-export cross-domain DTOs
export type AvailableRoleDto = components["schemas"]["AvailableRoleDto"];
export type CreatePermissionRequestDto = components["schemas"]["CreatePermissionRequestDto"];
export type PermissionRequestDto =
	& Omit<
		components["schemas"]["PermissionRequestDto"],
		"id">
	& { id: number; };
