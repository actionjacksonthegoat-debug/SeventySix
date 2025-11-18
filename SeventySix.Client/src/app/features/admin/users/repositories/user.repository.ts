/**
 * User Repository
 * Handles data access for user entities
 * Implements Repository Pattern (SOLID - SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { ApiService } from "@core/api-services/api.service";
import {
	User,
	UpdateUserRequest,
	UserQueryRequest,
	PagedResult
} from "@admin/users/models";
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
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users";

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
	 * @param user The user data to update (must include rowVersion for concurrency control)
	 * @returns Observable of updated user
	 */
	update(id: number | string, user: UpdateUserRequest): Observable<User>
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

	/**
	 * Get paginated users with filtering
	 * @param request Query parameters for pagination and filtering
	 * @returns Observable of paged result
	 */
	getPaged(request: UserQueryRequest): Observable<PagedResult<User>>
	{
		const params: HttpParams = new HttpParams()
			.set("page", request.page.toString())
			.set("pageSize", request.pageSize.toString())
			.set("searchTerm", request.searchTerm || "")
			.set(
				"includeInactive",
				request.includeInactive?.toString() || "false"
			)
			.set("sortBy", request.sortBy || "")
			.set(
				"sortDescending",
				request.sortDescending?.toString() || "false"
			);

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
		if (excludeId)
		{
			const params: HttpParams = new HttpParams().set(
				"excludeId",
				excludeId.toString()
			);
			return this.apiService.get<boolean>(
				`${this.endpoint}/check/username/${username}`,
				params
			);
		}

		return this.apiService.get<boolean>(
			`${this.endpoint}/check/username/${username}`
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
