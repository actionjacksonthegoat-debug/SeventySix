/**
 * User Service
 * Business logic layer for user operations
 * Uses TanStack Query for caching and state management
 * Uses repository pattern for data access (SRP, DIP)
 * Extends BaseFilterService for filter state management
 */

import { inject, Injectable, signal, WritableSignal } from "@angular/core";
import { HttpContext } from "@angular/common/http";
import {
	injectQuery,
	injectMutation,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { User, UpdateUserRequest, UserQueryRequest } from "@admin/users/models";
import { UserRepository } from "@admin/users/repositories";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import { BaseFilterService } from "@infrastructure/services/base-filter.service";
import { FORCE_REFRESH } from "@infrastructure/interceptors/cache-bypass.interceptor";

/**
 * Service for user business logic
 * Follows Service Layer pattern to encapsulate business rules
 * All methods use TanStack Query for automatic caching and state management
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class UserService extends BaseFilterService<UserQueryRequest>
{
	private readonly userRepository: UserRepository = inject(UserRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("users");

	/** Signal to trigger cache bypass - toggling this value forces fresh data fetch */
	private readonly forceRefreshTrigger: WritableSignal<boolean> =
		signal<boolean>(false);

	constructor()
	{
		super({
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
		return injectQuery(() => ({
			queryKey: QueryKeys.users
				.paged(this.getCurrentFilter())
				.concat(this.forceRefreshTrigger()),
			queryFn: () =>
			{
				const context: HttpContext | undefined =
					this.forceRefreshTrigger()
						? new HttpContext().set(FORCE_REFRESH, true)
						: undefined;

				return lastValueFrom(
					this.userRepository.getPaged(
						this.getCurrentFilter(),
						context
					)
				);
			},
			...this.queryConfig
		}));
	}

	/**
	 * Query for user by ID
	 * @param id The user identifier
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getUserById(id: number | string)
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.users.single(id),
			queryFn: () => lastValueFrom(this.userRepository.getById(id)),
			...this.queryConfig
		}));
	}

	/**
	 * Mutation for creating user
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	createUser()
	{
		return injectMutation(() => ({
			mutationFn: (user: Partial<User>) =>
				lastValueFrom(this.userRepository.create(user)),
			onSuccess: () =>
			{
				// Invalidate paged users queries
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.all
				});
			}
		}));
	}

	/**
	 * Mutation for updating user
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	updateUser()
	{
		return injectMutation(() => ({
			mutationFn: ({
				id,
				user
			}: {
				id: number | string;
				user: UpdateUserRequest;
			}) => lastValueFrom(this.userRepository.update(id, user)),
			onSuccess: (_, variables) =>
			{
				// Invalidate specific user and all user queries
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.single(variables.id)
				});
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.all
				});
			}
		}));
	}

	/**
	 * Mutation for deleting user
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteUser()
	{
		return injectMutation(() => ({
			mutationFn: (id: number | string) =>
				lastValueFrom(this.userRepository.delete(id)),
			onSuccess: () =>
			{
				// Invalidate all user queries
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.all
				});
			}
		}));
	}

	/**
	 * Clear all filters and reset to defaults
	 * Overrides base class method
	 */
	override clearFilters(): void
	{
		this.filter.set({
			page: 1,
			pageSize: 50,
			sortBy: "Id",
			sortDescending: true,
			startDate: null,
			endDate: null
		});
	}

	/**
	 * Query for user by username
	 * @param username The username to search
	 * @returns Query object with user data
	 */
	getUserByUsername(username: string)
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.users.byUsername(username),
			queryFn: () =>
				lastValueFrom(this.userRepository.getByUsername(username)),
			...this.queryConfig
		}));
	}

	/**
	 * Check username availability (not cached for real-time validation)
	 * @param username The username to check
	 * @param excludeId Optional user ID to exclude
	 * @returns Promise of boolean
	 */
	checkUsernameAvailability(
		username: string,
		excludeId?: number
	): Promise<boolean>
	{
		return lastValueFrom(
			this.userRepository.checkUsername(username, excludeId)
		);
	}

	/**
	 * Mutation for restoring deleted user
	 * @returns Mutation object
	 */
	restoreUser()
	{
		return injectMutation(() => ({
			mutationFn: (id: number | string) =>
				lastValueFrom(this.userRepository.restore(id)),
			onSuccess: () =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.all
				});
			}
		}));
	}

	/**
	 * Mutation for bulk activating users
	 * @returns Mutation object
	 */
	bulkActivateUsers()
	{
		return injectMutation(() => ({
			mutationFn: (ids: number[]) =>
				lastValueFrom(this.userRepository.bulkActivate(ids)),
			onSuccess: () =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.all
				});
			}
		}));
	}

	/**
	 * Mutation for bulk deactivating users
	 * @returns Mutation object
	 */
	bulkDeactivateUsers()
	{
		return injectMutation(() => ({
			mutationFn: (ids: number[]) =>
				lastValueFrom(this.userRepository.bulkDeactivate(ids)),
			onSuccess: () =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.users.all
				});
			}
		}));
	}

	/**
	 * Mutation for initiating password reset
	 * Sends password reset email to user
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	resetPassword()
	{
		return injectMutation(() => ({
			mutationFn: (id: number | string) =>
				lastValueFrom(this.userRepository.resetPassword(id))
		}));
	}

	/**
	 * Query for user roles
	 * @param userId The user ID
	 * @returns Query object with roles data
	 */
	getUserRoles(userId: number | string)
	{
		return injectQuery(() => ({
			queryKey: ["users", userId, "roles"],
			queryFn: () =>
				lastValueFrom(this.userRepository.getRoles(Number(userId))),
			...this.queryConfig
		}));
	}

	/**
	 * Mutation for adding a role to a user
	 * @returns Mutation object
	 */
	addRole()
	{
		return injectMutation(() => ({
			mutationFn: ({ userId, role }: { userId: number; role: string }) =>
				lastValueFrom(this.userRepository.addRole(userId, role)),
			onSuccess: (_, variables) =>
			{
				this.queryClient.invalidateQueries({
					queryKey: ["users", variables.userId, "roles"]
				});
			}
		}));
	}

	/**
	 * Mutation for removing a role from a user
	 * @returns Mutation object
	 */
	removeRole()
	{
		return injectMutation(() => ({
			mutationFn: ({ userId, role }: { userId: number; role: string }) =>
				lastValueFrom(this.userRepository.removeRole(userId, role)),
			onSuccess: (_, variables) =>
			{
				this.queryClient.invalidateQueries({
					queryKey: ["users", variables.userId, "roles"]
				});
			}
		}));
	}

	/**
	 * Force refresh all active user queries
	 * Bypasses cache and fetches fresh data from server
	 */
	async forceRefresh(): Promise<void>
	{
		this.forceRefreshTrigger.update((value: boolean) => !value);
	}
}
