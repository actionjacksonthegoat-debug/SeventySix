/**
 * Admin users models barrel export
 */

import { components } from "@shared/generated-open-api/generated-open-api";
import { BaseQueryRequest } from "@shared/models";

// User DTOs with type corrections for numeric IDs
export type UserDto =
	& Omit<
		components["schemas"]["UserDto"],
		"id" | "statusCode">
	& {
		id: number;
		statusCode?: number | null;
	};
export type CreateUserRequest =
	components["schemas"]["CreateUserRequest"];
export type UpdateUserRequest =
	& Omit<
		components["schemas"]["UpdateUserRequest"],
		"id">
	& {
		id: number;
	};
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
