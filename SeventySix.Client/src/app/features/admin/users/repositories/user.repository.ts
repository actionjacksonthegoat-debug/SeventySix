/**
 * User Repository
 * Handles data access for user entities
 * Implements Repository Pattern (SOLID - SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@core/api-services/api.service";
import { User } from "@admin/users/models";
import { IRepository } from "@core/repositories/base.repository";

/**
 * Repository for user data access
 * Follows the Repository pattern to abstract API calls
 */
@Injectable({
	providedIn: "root"
})
export class UserRepository implements IRepository<User>
{
	private readonly apiService = inject(ApiService);
	private readonly endpoint = "User";

	/**
	 * Get all users
	 * @returns Observable array of users
	 */
	getAll(): Observable<User[]>
	{
		return this.apiService.get<User[]>(this.endpoint);
	}

	/**
	 * Get user by ID
	 * @param id The user identifier
	 * @returns Observable of user
	 */
	getById(id: number | string): Observable<User>
	{
		return this.apiService.get<User>(`${this.endpoint}/${id}`);
	}

	/**
	 * Create new user
	 * @param user The user data to create
	 * @returns Observable of created user
	 */
	create(user: Partial<User>): Observable<User>
	{
		return this.apiService.post<User>(this.endpoint, user);
	}

	/**
	 * Update existing user
	 * @param id The user identifier
	 * @param user The user data to update
	 * @returns Observable of updated user
	 */
	update(id: number | string, user: Partial<User>): Observable<User>
	{
		return this.apiService.put<User>(`${this.endpoint}/${id}`, user);
	}

	/**
	 * Delete user
	 * @param id The user identifier
	 * @returns Observable of void
	 */
	delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}
}
