import { inject, Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { PagedResponse } from "@infrastructure/models";
import { buildHttpParams } from "@infrastructure/utils/http-params.utility";
import { User, UpdateUserRequest, UserQueryRequest } from "@admin/users/models";

@Injectable()
export class UserRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users";

	getAll(): Observable<User[]>
	{
		return this.apiService.get<User[]>(this.endpoint);
	}

	getById(id: number | string): Observable<User>
	{
		return this.apiService.get<User>(`${this.endpoint}/${id}`);
	}

	create(user: Partial<User>): Observable<User>
	{
		return this.apiService.post<User>(this.endpoint, user);
	}

	update(id: number | string, user: UpdateUserRequest): Observable<User>
	{
		return this.apiService.put<User>(`${this.endpoint}/${id}`, user);
	}

	delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	getPaged(request: UserQueryRequest): Observable<PagedResponse<User>>
	{
		const params: HttpParams = buildHttpParams({
			page: request.page,
			pageSize: request.pageSize,
			searchTerm: request.searchTerm || "",
			includeInactive: request.includeInactive || false,
			sortBy: request.sortBy,
			sortDescending: request.sortDescending
		});

		return this.apiService.get<PagedResponse<User>>(
			`${this.endpoint}/paged`,
			params
		);
	}

	getByUsername(username: string): Observable<User>
	{
		return this.apiService.get<User>(
			`${this.endpoint}/username/${username}`
		);
	}

	checkUsername(username: string, excludeId?: number): Observable<boolean>
	{
		const params: HttpParams | undefined = excludeId
			? buildHttpParams({ excludeId })
			: undefined;

		return this.apiService.get<boolean>(
			`${this.endpoint}/check/username/${username}`,
			params
		);
	}

	restore(id: number | string): Observable<void>
	{
		return this.apiService.post<void, Record<string, never>>(
			`${this.endpoint}/${id}/restore`,
			{}
		);
	}

	bulkActivate(ids: number[]): Observable<number>
	{
		return this.apiService.post<number, number[]>(
			`${this.endpoint}/bulk/activate`,
			ids
		);
	}

	bulkDeactivate(ids: number[]): Observable<number>
	{
		return this.apiService.post<number, number[]>(
			`${this.endpoint}/bulk/deactivate`,
			ids
		);
	}

	/**
	 * Initiates password reset for a user by sending reset email.
	 * @param id - The user ID to reset password for.
	 * @returns Observable that completes when email is sent.
	 */
	resetPassword(id: number | string): Observable<void>
	{
		return this.apiService.post<void, Record<string, never>>(
			`${this.endpoint}/${id}/reset-password`,
			{}
		);
	}
}
