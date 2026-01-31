/**
 * Permission requests models barrel export.
 * Types from generated OpenAPI.
 */

import { components } from "@shared/generated-open-api/generated-open-api";

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
