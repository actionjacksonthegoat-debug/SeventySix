/**
 * User Service
 * Business logic layer for User operations
 * Uses TanStack Query for caching and state management
 * Extends BaseFilterService for filter state management
 */

import {
	CreateUserRequest,
	PagedResultOfUserDto,
	UpdateUserRequest,
	UserDto,
	UserQueryRequest
} from "@admin/users/models";
import { HttpContext, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ApiService } from "@shared/services/api.service";
import { BaseQueryService } from "@shared/services/base-query.service";
import { buildHttpParams } from "@shared/utilities/http-params.utility";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	CreateMutationResult,
	injectQuery
} from "@tanstack/angular-query-experimental";
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
	/**
	 * Query key prefix used by TanStack Query for namespacing user queries.
	 * @type {string}
	 */
	protected readonly queryKeyPrefix: string = "users";

	/**
	 * API service used to communicate with the backend for user operations.
	 * @type {ApiService}
	 * @private
	 * @readonly
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * REST endpoint base path for user-related API routes.
	 * @type {string}
	 * @private
	 * @readonly
	 */
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
	 * Query for paginated users with current filter.
	 * Automatically cached with TanStack Query.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with data, isLoading, error, etc.
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
	 * Query for User by ID.
	 * @param {number | string} userId
	 * The User identifier.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with data, isLoading, error, etc.
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
	 * Mutation for creating User.
	 * Automatically invalidates related queries on success.
	 * @returns {CreateMutationResult<UserDto, Error, Partial<UserDto>>}
	 * Mutation object with mutate, isPending, error, etc.
	 */
	createUser(): CreateMutationResult<UserDto, Error, Partial<UserDto>>
	{
		return this.createMutation<Partial<UserDto>, UserDto>(
			(user) =>
				this.apiService.post<UserDto>(this.endpoint, user as CreateUserRequest));
	}

	/**
	 * Mutation for updating User.
	 * @returns {CreateMutationResult<UserDto, Error, { userId: number | string; user: UpdateUserRequest }>}
	 * Mutation object with mutate, isPending, error, etc.
	 */
	updateUser(): CreateMutationResult<UserDto, Error, { userId: number | string; user: UpdateUserRequest }>
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
	 * Mutation for deleting User.
	 * @returns {CreateMutationResult<void, Error, number | string>}
	 * Mutation object with mutate, isPending, error, etc.
	 */
	deleteUser(): CreateMutationResult<void, Error, number | string>
	{
		return this.createMutation<number | string, void>(
			(userId) =>
				this.apiService.delete<void>(`${this.endpoint}/${userId}`));
	}

	/**
	 * Clear all active filters and reset to the service defaults.
	 * Overrides the base class implementation to reset local filter state.
	 * @returns {void}
	 */
	override clearFilters(): void
	{
		this.resetFilter();
	}

	/**
	 * Query for User by username.
	 * @param {string} username
	 * The username to search.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with User data.
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
	 * Check username availability (not cached for real-time validation).
	 * @param {string} username
	 * The username to check.
	 * @param {number | undefined} [excludeUserId]
	 * Optional User ID to exclude.
	 * @returns {Promise<boolean>}
	 * Promise that resolves to true when username is available, false otherwise.
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
	 * Mutation for restoring deleted User.
	 * @returns {CreateMutationResult<void, Error, number | string>}
	 * Mutation object.
	 */
	restoreUser(): CreateMutationResult<void, Error, number | string>
	{
		return this.createMutation<number | string, void>(
			(userId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/${userId}/restore`,
					{}));
	}

	/**
	 * Mutation for bulk activating users.
	 * @returns {CreateMutationResult<number, Error, number[]>}
	 * Mutation object.
	 */
	bulkActivateUsers(): CreateMutationResult<number, Error, number[]>
	{
		return this.createMutation<number[], number>(
			(userIds) =>
				this.apiService.post<number, number[]>(`${this.endpoint}/bulk/activate`, userIds));
	}

	/**
	 * Mutation for bulk deactivating users.
	 * @returns {CreateMutationResult<number, Error, number[]>}
	 * Mutation object.
	 */
	bulkDeactivateUsers(): CreateMutationResult<number, Error, number[]>
	{
		return this.createMutation<number[], number>(
			(userIds) =>
				this.apiService.post<number, number[]>(`${this.endpoint}/bulk/deactivate`, userIds));
	}

	/**
	 * Mutation for initiating password reset.
	 * Sends password reset email to User.
	 * @returns {CreateMutationResult<void, Error, number | string>}
	 * Mutation object with mutate, isPending, error, etc.
	 */
	resetPassword(): CreateMutationResult<void, Error, number | string>
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
	 * Query for User roles.
	 * @param {number | string} userId
	 * The User ID.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with roles data.
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
	 * Mutation for adding a role to a User.
	 * @returns {CreateMutationResult<void, Error, { userId: number; roleName: string }>}
	 * Mutation object.
	 */
	addRole(): CreateMutationResult<void, Error, { userId: number; roleName: string }>
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
	 * Mutation for removing a role from a User.
	 * @returns {CreateMutationResult<void, Error, { userId: number; roleName: string }>}
	 * Mutation object.
	 */
	removeRole(): CreateMutationResult<void, Error, { userId: number; roleName: string }>
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

	/**
	 * Gets paged users with the given filter.
	 * @param {UserQueryRequest} request
	 * Filter/request parameters.
	 * @param {HttpContext | undefined} [context]
	 * Optional HTTP context for the request.
	 * @returns {Observable<PagedResultOfUserDto>}
	 * Observable that resolves to paged user results.
	 */
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
