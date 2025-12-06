import { BaseQueryRequest } from "@infrastructure/models";

/** User model from API. Matches backend UserDto structure. */
export interface User
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	createDate: string;
	isActive: boolean;
	createdBy: string;
	modifyDate?: string;
	modifiedBy: string;
	lastLoginAt?: string;
	isDeleted?: boolean;
	deletedAt?: string;
	deletedBy?: string;
	needsPendingEmail?: boolean;
}

/** Create User Request - structure for creating a new user. */
export interface CreateUserRequest
{
	username: string;
	email: string;
	fullName: string;
	isActive?: boolean;
}

/** Update User Request - structure for updating an existing user. */
export interface UpdateUserRequest
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	isActive: boolean;
}

/** User Query Request - query parameters for paginated user requests. */
export interface UserQueryRequest extends BaseQueryRequest
{
	/** Filter by active status. null = all users, true = active only, false = inactive only */
	isActive?: boolean;

	/** Include soft-deleted users in results. Default false. */
	includeDeleted?: boolean;
}
