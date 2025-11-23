/**
 * User Repository
 * Handles data access for user entities
 * Implements Repository Pattern (SOLID - SRP, DIP)
 */

import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { HttpRepository } from "@core/repositories/http.repository";
import {
	User,
	UpdateUserRequest,
	UserQueryRequest,
	PagedResult
} from "@admin/users/models";

/**
 * Repository for user data access
 * Extends HttpRepository for standard CRUD operations
 */
@Injectable({
	providedIn: "root"
})
export class UserRepository extends HttpRepository<User>
{
	protected readonly endpoint: string = "users";

	/**
	 * Get all users
	 * @returns Observable array of users
	 */
	override getAll(): Observable<User[]>
	{
		return this.apiService.get<User[]>(this.endpoint);
	}

	/**
	 * Get user by ID
	 * @param id The user identifier
	 * @returns Observable of user
	 */
	override getById(id: number | string): Observable<User>
	{
		return this.apiService.get<User>(`${this.endpoint}/${id}`);
	}

	/**
	 * Create new user
	 * @param user The user data to create
	 * @returns Observable of created user
	 */
	override create(user: Partial<User>): Observable<User>
	{
		return this.apiService.post<User>(this.endpoint, user);
	}

	/**
	 * Update existing user
	 * @param id The user identifier
	 * @param user The user data to update (must include rowVersion for concurrency control)
	 * @returns Observable of updated user
	 */
	override update(
		id: number | string,
		user: UpdateUserRequest
	): Observable<User>
	{
		return this.apiService.put<User>(`${this.endpoint}/${id}`, user);
	}

	/**
	 * Delete user
	 * @param id The user identifier
	 * @returns Observable of void
	 */
	override delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	/**
	 * Get paginated users with filtering
	 * @param request Query parameters for pagination and filtering
	 * @returns Observable of paged result
	 */
	getPaged(request: UserQueryRequest): Observable<PagedResult<User>>
	{
		const params: HttpParams = this.buildParams({
			page: request.page,
			pageSize: request.pageSize,
			searchTerm: request.searchTerm || "",
			includeInactive: request.includeInactive || false,
			sortBy: request.sortBy || "",
			sortDescending: request.sortDescending || false
		});

		return this.apiService.get<PagedResult<User>>(
			`${this.endpoint}/paged`,
			params
		);
	}

	/**
	 * Get user by username
	 * @param username The username to search for
	 * @returns Observable of user
	 */
	getByUsername(username: string): Observable<User>
	{
		return this.apiService.get<User>(
			`${this.endpoint}/username/${username}`
		);
	}

	/**
	 * Check if username exists
	 * @param username The username to check
	 * @param excludeId Optional user ID to exclude from check (for updates)
	 * @returns Observable of boolean
	 */
	checkUsername(username: string, excludeId?: number): Observable<boolean>
	{
		const params: HttpParams | undefined = excludeId
			? this.buildParams({ excludeId })
			: undefined;

		return this.apiService.get<boolean>(
			`${this.endpoint}/check/username/${username}`,
			params
		);
	}

	/**
	 * Restore soft-deleted user
	 * @param id The user identifier
	 * @returns Observable of void
	 */
	restore(id: number | string): Observable<void>
	{
		return this.apiService.post<void, Record<string, never>>(
			`${this.endpoint}/${id}/restore`,
			{}
		);
	}

	/**
	 * Bulk activate users
	 * @param ids Array of user IDs to activate
	 * @returns Observable of count of activated users
	 */
	bulkActivate(ids: number[]): Observable<number>
	{
		return this.apiService.post<number, number[]>(
			`${this.endpoint}/bulk/activate`,
			ids
		);
	}

	/**
	 * Bulk deactivate users
	 * @param ids Array of user IDs to deactivate
	 * @returns Observable of count of deactivated users
	 */
	bulkDeactivate(ids: number[]): Observable<number>
	{
		return this.apiService.post<number, number[]>(
			`${this.endpoint}/bulk/deactivate`,
			ids
		);
	}
}
