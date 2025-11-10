/**
 * User service
 * Business logic layer for user operations
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User, CreateUserRequest } from "@core/models/interfaces/user";
import { UserRepository } from "@core/repositories/user.repository";

/**
 * Service for user-related operations.
 * Implements business logic and delegates data access to repository.
 */
@Injectable({
	providedIn: "root"
})
export class UserService
{
	private readonly userRepository = inject(UserRepository);

	/**
	 * Get all users
	 */
	getAllUsers(): Observable<User[]>
	{
		return this.userRepository.getAll();
	}

	/**
	 * Get user by ID
	 * @param id User identifier
	 */
	getUserById(id: number): Observable<User>
	{
		return this.userRepository.getById(id);
	}

	/**
	 * Create new user
	 * @param request User creation request
	 */
	createUser(request: CreateUserRequest): Observable<User>
	{
		return this.userRepository.create(request);
	}

	/**
	 * Update existing user
	 * @param id User identifier
	 * @param user Partial user data to update
	 */
	updateUser(id: number, user: Partial<User>): Observable<User>
	{
		return this.userRepository.update(id, user);
	}

	/**
	 * Delete user
	 * @param id User identifier
	 */
	deleteUser(id: number): Observable<void>
	{
		return this.userRepository.delete(id);
	}
}
