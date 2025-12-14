/**
 * User Service
 * Business logic layer for User operations
 * Uses TanStack Query for caching and state management
 * Extends BaseFilterService for filter state management
 */

import {
	CreateUserRequest,
	UpdateUserRequest,
	UserDto,
	UserQueryRequest
} from "@admin/users/models";
import { HttpContext, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { PagedResultOfUserDto } from "@infrastructure/api";
import { ApiService } from "@infrastructure/api-services/api.service";
import { BaseQueryService } from "@infrastructure/services/base-query.service";
import { buildHttpParams } from "@infrastructure/utils/http-params.utility";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom, Observable } from "rxjs";

/**
 * Service for User business logic
 * Follows Service Layer pattern to encapsulate business rules
 * All methods use TanStack Query for automatic caching and state management
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class UserService extends BaseQueryService<UserQueryRequest>
{
	protected readonly queryKeyPrefix: string = "users";
	private readonly apiService: ApiService =
		inject(ApiService);
	private readonly endpoint: string = "users";

	constructor()
	{
		super(
			{
				page: 1,
				pageSize: 50,
				sortBy: "Id",
				sortDescending: true,
				startDate: null,
				endDate: null
			});
	}

	/**
	 * Query for paginated users with current filter
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getPagedUsers()
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys
				.users
				.paged(this.getCurrentFilter())
				.concat(this.forceRefreshTrigger()),
				queryFn: () =>
					lastValueFrom(this.getPaged(this.getCurrentFilter(), this.getForceRefreshContext())),
				...this.queryConfig
			}));
	}

	/**
	 * Query for User by ID
	 * @param userId The User identifier
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getUserById(userId: number | string)
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.users.single(userId),
				queryFn: () =>
					lastValueFrom(this.apiService.get<UserDto>(`${this.endpoint}/${userId}`)),
				...this.queryConfig
			}));
	}

	/**
	 * Mutation for creating User
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	createUser()
	{
		return this.createMutation<Partial<UserDto>, UserDto>(
			(user) =>
				this.apiService.post<UserDto>(this.endpoint, user as CreateUserRequest));
	}

	/**
	 * Mutation for updating User
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	updateUser()
	{
		return this.createMutation<
			{
				userId: number | string;
				user: UpdateUserRequest;
			},
			UserDto>(
			(variables) =>
				this.apiService.put<UserDto>(`${this.endpoint}/${variables.userId}`, variables.user),
			(result, variables) =>
			{
				this.invalidateSingle(variables.userId);
				this.invalidateAll();
			});
	}

	/**
	 * Mutation for deleting User
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteUser()
	{
		return this.createMutation<number | string, void>(
			(userId) =>
				this.apiService.delete<void>(`${this.endpoint}/${userId}`));
	}

	/**
	 * Clear all filters and reset to defaults
	 * Overrides base class method
	 */
	override clearFilters(): void
	{
		this.resetFilter();
	}

	/**
	 * Query for User by username
	 * @param username The username to search
	 * @returns Query object with User data
	 */
	getUserByUsername(username: string)
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.users.byUsername(username),
				queryFn: () =>
					lastValueFrom(this.apiService.get<UserDto>(`${this.endpoint}/username/${username}`)),
				...this.queryConfig
			}));
	}

	/**
	 * Check username availability (not cached for real-time validation)
	 * @param username The username to check
	 * @param excludeUserId Optional User ID to exclude
	 * @returns Promise of boolean
	 */
	checkUsernameAvailability(
		username: string,
		excludeUserId?: number): Promise<boolean>
	{
		const params: HttpParams | undefined =
			excludeUserId
				? buildHttpParams(
					{ excludeId: excludeUserId })
				: undefined;

		return lastValueFrom(
			this.apiService.get<boolean>(`${this.endpoint}/check/username/${username}`, params));
	}

	/**
	 * Mutation for restoring deleted User
	 * @returns Mutation object
	 */
	restoreUser()
	{
		return this.createMutation<number | string, void>(
			(userId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/${userId}/restore`,
					{}));
	}

	/**
	 * Mutation for bulk activating users
	 * @returns Mutation object
	 */
	bulkActivateUsers()
	{
		return this.createMutation<number[], number>(
			(userIds) =>
				this.apiService.post<number, number[]>(`${this.endpoint}/bulk/activate`, userIds));
	}

	/**
	 * Mutation for bulk deactivating users
	 * @returns Mutation object
	 */
	bulkDeactivateUsers()
	{
		return this.createMutation<number[], number>(
			(userIds) =>
				this.apiService.post<number, number[]>(`${this.endpoint}/bulk/deactivate`, userIds));
	}

	/**
	 * Mutation for initiating password reset
	 * Sends password reset email to User
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	resetPassword()
	{
		return this.createMutation<number | string, void>(
			(userId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/${userId}/reset-password`,
					{}),
			() =>
			{
				// No cache invalidation needed for password reset
			});
	}

	/**
	 * Query for User roles
	 * @param userId The User ID
	 * @returns Query object with roles data
	 */
	getUserRoles(userId: number | string)
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.users.roles(userId),
				queryFn: () =>
					lastValueFrom(this.apiService.get<string[]>(`${this.endpoint}/${userId}/roles`)),
				...this.queryConfig
			}));
	}

	/**
	 * Mutation for adding a role to a User
	 * @returns Mutation object
	 */
	addRole()
	{
		return this.createMutation<
			{
				userId: number;
				roleName: string;
			},
			void>(
			(variables) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/${variables.userId}/roles/${variables.roleName}`,
					{}),
			(result, variables) =>
			{
				this.queryClient.invalidateQueries(
					{
						queryKey: QueryKeys.users.roles(variables.userId)
					});
			});
	}

	/**
	 * Mutation for removing a role from a User
	 * @returns Mutation object
	 */
	removeRole()
	{
		return this.createMutation<
			{
				userId: number;
				roleName: string;
			},
			void>(
			(variables) =>
				this.apiService.delete<void>(`${this.endpoint}/${variables.userId}/roles/${variables.roleName}`),
			(result, variables) =>
			{
				this.queryClient.invalidateQueries(
					{
						queryKey: QueryKeys.users.roles(variables.userId)
					});
			});
	}

	/** Gets paged users with the given filter. */
	private getPaged(
		request: UserQueryRequest,
		context?: HttpContext): Observable<PagedResultOfUserDto>
	{
		const params: HttpParams =
			buildHttpParams(request);

		return this.apiService.get<PagedResultOfUserDto>(
			`${this.endpoint}/paged`,
			params,
			context);
	}
}
