/**
 * User Service
 * Business logic layer for user operations
 * Uses TanStack Query for caching and state management
 * Uses repository pattern for data access (SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	injectMutation,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { User } from "@admin/users/models";
import { UserRepository } from "@admin/users/repositories";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * Service for user business logic
 * Follows Service Layer pattern to encapsulate business rules
 * All methods use TanStack Query for automatic caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class UserService
{
	private readonly userRepository = inject(UserRepository);
	private readonly queryClient = inject(QueryClient);
	private readonly queryConfig = getQueryConfig("users");

	/**
	 * Query for all users
	 * Automatically cached with TanStack Query
	 * @returns Query object with data, isLoading, error, etc.
	 */
	getAllUsers()
	{
		return injectQuery(() => ({
			queryKey: ["users", "all"],
			queryFn: () => lastValueFrom(this.userRepository.getAll()),
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
			queryKey: ["users", "user", id],
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
				// Invalidate and refetch all users
				this.queryClient.invalidateQueries({
					queryKey: ["users", "all"]
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
				user: Partial<User>;
			}) => lastValueFrom(this.userRepository.update(id, user)),
			onSuccess: (_, variables) =>
			{
				// Invalidate specific user and list
				this.queryClient.invalidateQueries({
					queryKey: ["users", "user", variables.id]
				});
				this.queryClient.invalidateQueries({
					queryKey: ["users", "all"]
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
				// Invalidate all users
				this.queryClient.invalidateQueries({
					queryKey: ["users", "all"]
				});
			}
		}));
	}
}
