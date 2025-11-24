/**
 * User interface
 * Represents user data structure from the API
 * Matches backend UserDto structure
 */
export interface User
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	createdAt: string;
	isActive: boolean;
	createdBy?: string;
	modifiedAt?: string;
	modifiedBy?: string;
	lastLoginAt?: string;
	rowVersion?: number;
}

/**
 * Create User Request interface
 * Represents the structure for creating a new user
 *
 * Validation Rules:
 * - username: Required, 3-50 characters, unique
 * - email: Required, valid email format, unique
 * - fullName: Optional, max 100 characters
 * - isActive: Optional, defaults to true
 */
export interface CreateUserRequest
{
	username: string;
	email: string;
	fullName?: string;
	isActive?: boolean;
}

/**
 * Update User Request interface
 * Represents the structure for updating an existing user
 * Includes RowVersion for optimistic concurrency control
 */
export interface UpdateUserRequest
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	isActive: boolean;
	rowVersion?: number;
}

import { BaseQueryRequest } from "@core/models";

/**
 * User Query Request interface
 * Represents query parameters for paginated user requests
 * Extends BaseQueryRequest for common pagination and filtering properties
 */
export interface UserQueryRequest extends BaseQueryRequest
{
	/**
	 * Include inactive users in results
	 */
	includeInactive?: boolean;

	/**
	 * Filter by last login date range (uses startDate/endDate from BaseQueryRequest)
	 */
}

/**
 * Paged Result interface
 * Generic wrapper for paginated API responses
 */
export interface PagedResult<T>
{
	items: T[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}
