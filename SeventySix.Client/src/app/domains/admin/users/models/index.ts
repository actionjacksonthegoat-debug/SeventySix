/**
 * Admin users models barrel export
 */

import { components } from "@shared/generated-open-api/generated-open-api";
import { BaseQueryRequest } from "@shared/models";

// User DTOs with type corrections for numeric IDs
/**
 * Data transfer object representing a user with numeric ID and optional status code.
 * Based on the generated `UserDto` schema with local numeric ID adjustments.
 * Note: createdBy is extended to allow null to match CreateUserRequest compatibility.
 */
export type UserDto =
	& Omit<
		components["schemas"]["UserDto"],
		"id" | "statusCode" | "createdBy">
	& {
		id: number;
		statusCode?: number | null;
		createdBy?: string | null;
	};

/**
 * Payload used to create a new user.
 * Mirrors the generated `CreateUserRequest` schema.
 */
export type CreateUserRequest = components["schemas"]["CreateUserRequest"];

/**
 * Payload used to update an existing user. Ensures numeric `id`.
 * Mirrors the generated `UpdateUserRequest` schema.
 */
export type UpdateUserRequest =
	& Omit<
		components["schemas"]["UpdateUserRequest"],
		"id">
	& {
		id: number;
	};

/**
 * Paged result containing UserDto items and pagination metadata.
 * Mirrors the generated `PagedResultOfUserDto` schema with numeric page fields.
 */
export type PagedResultOfUserDto =
	& Omit<
		components["schemas"]["PagedResultOfUserDto"],
		"page" | "pageSize" | "totalCount" | "totalPages">
	& {
		page: number;
		pageSize: number;
		totalCount: number;
		totalPages: number;
	};

/** User Query Request - query parameters for paginated user requests. */
export interface UserQueryRequest extends BaseQueryRequest
{
	/** Filter by active status. null = all users, true = active only, false = inactive only */
	isActive?: boolean;

	/** Include soft-deleted users in results. Default false. */
	includeDeleted?: boolean;
}

export * from "./user-list-preferences.model";
