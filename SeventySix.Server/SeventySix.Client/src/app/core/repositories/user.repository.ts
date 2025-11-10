/**
 * User Repository
 * Handles data access for user entities
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@core/api-services/api.service";
import { User, CreateUserRequest } from "@core/models/interfaces/user";
import { IRepository } from "./base.repository";

/**
 * Repository for user data access
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
	 */
	getAll(): Observable<User[]>
	{
		return this.apiService.get<User[]>(this.endpoint);
	}

	/**
	 * Get user by ID
	 * @param id The user identifier
	 */
	getById(id: number | string): Observable<User>
	{
		return this.apiService.get<User>(`${this.endpoint}/${id}`);
	}

	/**
	 * Create new user
	 * @param user The user data to create
	 */
	create(user: CreateUserRequest): Observable<User>
	{
		return this.apiService.post<User>(this.endpoint, user);
	}

	/**
	 * Update existing user
	 * @param id The user identifier
	 * @param user The user data to update
	 */
	update(
		id: number | string,
		user: Partial<User>
	): Observable<User>
	{
		return this.apiService.put<User>(
			`${this.endpoint}/${id}`,
			user
		);
	}

	/**
	 * Delete user
	 * @param id The user identifier
	 */
	delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}
}
