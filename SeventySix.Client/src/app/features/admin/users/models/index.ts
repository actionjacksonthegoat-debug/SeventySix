/**
 * Admin users models barrel export
 */

// Re-export generated DTOs
export type {
	CreateUserRequest,
	UpdateUserRequest,
	UserDto
} from "@infrastructure/api";

// Query model extends BaseQueryRequest (client-side only)
import { BaseQueryRequest } from "@shared/models";

/** User Query Request - query parameters for paginated user requests. */
export interface UserQueryRequest extends BaseQueryRequest
{
	/** Filter by active status. null = all users, true = active only, false = inactive only */
	isActive?: boolean;

	/** Include soft-deleted users in results. Default false. */
	includeDeleted?: boolean;
}
