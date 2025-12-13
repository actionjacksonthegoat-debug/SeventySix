/**
 * User Service
 * Business logic layer for User operations
 * Uses TanStack Query for caching and state management
 * Uses repository pattern for data access (SRP, DIP)
 * Extends BaseFilterService for filter state management
 */

import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	injectMutation
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
	UserDto,
	CreateUserRequest,
	UpdateUserRequest,
	UserQueryRequest
} from "@admin/users/models";
import { UserRepository } from "@admin/users/repositories";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import { BaseQueryService } from "@infrastructure/services/base-query.service";

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
	private readonly userRepository: UserRepository = inject(UserRepository);

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
				lastValueFrom(
					this.userRepository.getPaged(
						this.getCurrentFilter(),
						this.getForceRefreshContext()
					)
				),
			...this.queryConfig
		}));
	}

	/**
	 * Query for User by ID
	 * @param id The User identifier
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
	 * Mutation for creating User
	 * Automatically invalidates related queries on success
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	createUser()
	{
		return injectMutation(() => ({
			mutationFn: (user: Partial<UserDto>) =>
				lastValueFrom(this.userRepository.create(user as CreateUserRequest)),
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
	 * Mutation for updating User
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
				// Invalidate specific User and all User queries
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
	 * Mutation for deleting User
	 * @returns Mutation object with mutate, isPending, error, etc.
	 */
	deleteUser()
	{
		return injectMutation(() => ({
			mutationFn: (id: number | string) =>
				lastValueFrom(this.userRepository.delete(id)),
			onSuccess: () =>
			{
				// Invalidate all User queries
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
		this.resetFilter();
	}

	/**
	 * Query for User by username
	 * @param username The username to search
	 * @returns Query object with User data
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
	 * @param excludeId Optional User ID to exclude
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
	 * Mutation for restoring deleted User
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
	 * Sends password reset email to User
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
	 * Query for User roles
	 * @param userId The User ID
	 * @returns Query object with roles data
	 */
	getUserRoles(userId: number | string)
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.users.roles(userId),
			queryFn: () =>
				lastValueFrom(this.userRepository.getRoles(Number(userId))),
			...this.queryConfig
		}));
	}

	/**
	 * Mutation for adding a role to a User
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
					queryKey: QueryKeys.users.roles(variables.userId)
				});
			}
		}));
	}

	/**
	 * Mutation for removing a role from a User
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
					queryKey: QueryKeys.users.roles(variables.userId)
				});
			}
		}));
	}
}
