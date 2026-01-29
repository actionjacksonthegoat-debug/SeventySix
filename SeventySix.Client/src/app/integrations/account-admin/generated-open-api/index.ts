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

/**
 * Permission request DTO with narrowed numeric types.
 *
 * OpenAPI generates `id: number | string` for int64 fields.
 * We narrow to `number` because JavaScript can safely represent
 * integers up to Number.MAX_SAFE_INTEGER (2^53) and our IDs
 * will never exceed this range.
 */
export type PermissionRequestDto =
	& Omit<
		components["schemas"]["PermissionRequestDto"],
		"id" | "userId">
	& { id: number; userId: number; };
