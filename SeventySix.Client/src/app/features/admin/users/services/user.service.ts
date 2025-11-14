/**
 * User Service
 * Business logic layer for user operations
 * Uses repository pattern for data access (SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { User } from "@admin/users/models";
import { UserRepository } from "@admin/users/repositories";

/**
 * Service for user business logic
 * Follows Service Layer pattern to encapsulate business rules
 */
@Injectable({
	providedIn: "root"
})
export class UserService
{
	private readonly userRepository = inject(UserRepository);

	/**
	 * Get all users
	 * @returns Observable of user array
	 */
	getAllUsers(): Observable<User[]>
	{
		return this.userRepository.getAll();
	}

	/**
	 * Get user by ID
	 * @param id The user identifier
	 * @returns Observable of user
	 */
	getUserById(id: number | string): Observable<User>
	{
		return this.userRepository.getById(id);
	}

	/**
	 * Create new user
	 * @param user The user data
	 * @returns Observable of created user
	 */
	createUser(user: Partial<User>): Observable<User>
	{
		return this.userRepository.create(user);
	}

	/**
	 * Update existing user
	 * @param id The user identifier
	 * @param user The user data to update
	 * @returns Observable of updated user
	 */
	updateUser(id: number | string, user: Partial<User>): Observable<User>
	{
		return this.userRepository.update(id, user);
	}

	/**
	 * Delete user
	 * @param id The user identifier
	 * @returns Observable of void
	 */
	deleteUser(id: number | string): Observable<void>
	{
		return this.userRepository.delete(id);
	}
}
