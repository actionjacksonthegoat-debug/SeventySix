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
}

/** Create User Request - structure for creating a new user. */
export interface CreateUserRequest
{
	username: string;
	email: string;
	fullName?: string;
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
	/** Include inactive users in results */
	includeInactive?: boolean;
}
