/**
 * User interface
 * Represents user data structure from the API
 */
export interface User
{
	id: number;
	username: string;
	email: string;
	fullName?: string;
	createdAt: string;
	isActive: boolean;
}

/**
 * Create User Request interface
 * Represents the structure for creating a new user
 */
export interface CreateUserRequest
{
	username: string;
	email: string;
	fullName?: string;
	isActive?: boolean;
}
