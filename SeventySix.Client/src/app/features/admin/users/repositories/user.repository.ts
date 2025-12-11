import { inject, Injectable } from "@angular/core";
import { HttpContext, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	PagedResultOfUserDto,
	UserDto,
	CreateUserRequest,
	UpdateUserRequest
} from "@infrastructure/api";
import { buildHttpParams } from "@infrastructure/utils/http-params.utility";
import { UserQueryRequest } from "@admin/users/models";

@Injectable()
export class UserRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users";

	getAll(): Observable<UserDto[]>
	{
		return this.apiService.get<UserDto[]>(this.endpoint);
	}

	getById(id: number | string): Observable<UserDto>
	{
		return this.apiService.get<UserDto>(`${this.endpoint}/${id}`);
	}

	create(user: CreateUserRequest): Observable<UserDto>
	{
		return this.apiService.post<UserDto>(this.endpoint, user);
	}

	update(id: number | string, user: UpdateUserRequest): Observable<UserDto>
	{
		return this.apiService.put<UserDto>(`${this.endpoint}/${id}`, user);
	}

	delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	getPaged(
		request: UserQueryRequest,
		context?: HttpContext
	): Observable<PagedResultOfUserDto>
	{
		const params: HttpParams = buildHttpParams(request);

		return this.apiService.get<PagedResultOfUserDto>(
			`${this.endpoint}/paged`,
			params,
			context
		);
	}

	getByUsername(username: string): Observable<UserDto>
	{
		return this.apiService.get<UserDto>(
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

	/** Gets roles for a user. */
	getRoles(userId: number): Observable<string[]>
	{
		return this.apiService.get<string[]>(
			`${this.endpoint}/${userId}/roles`
		);
	}

	/** Adds a role to a user. */
	addRole(userId: number, role: string): Observable<void>
	{
		return this.apiService.post<void, Record<string, never>>(
			`${this.endpoint}/${userId}/roles/${role}`,
			{}
		);
	}

	/** Removes a role from a user. */
	removeRole(userId: number, role: string): Observable<void>
	{
		return this.apiService.delete<void>(
			`${this.endpoint}/${userId}/roles/${role}`
		);
	}
}
