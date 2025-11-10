/**
 * User interface matching the API UserDto.
 * Represents a user entity in the system.
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
 * Create user request interface matching CreateUserRequest DTO.
 */
export interface CreateUserRequest
{
	username: string;
	email: string;
	fullName?: string;
	isActive: boolean;
}
