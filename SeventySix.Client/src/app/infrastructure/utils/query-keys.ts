/**
 * Query key structure for logs domain
 */
interface LogQueryKeys
{
	readonly all: readonly ["logs"];
	readonly paged: (filter: unknown) => readonly unknown[];
	readonly count: (filter: unknown) => readonly unknown[];
}

/**
 * Query key structure for users domain
 */
interface UserQueryKeys
{
	readonly all: readonly ["users"];
	readonly paged: (filter: unknown) => readonly unknown[];
	readonly single: (id: number | string) => readonly unknown[];
	readonly byUsername: (username: string) => readonly unknown[];
}

/**
 * Query keys structure
 */
interface QueryKeysType
{
	readonly logs: LogQueryKeys;
	readonly users: UserQueryKeys;
}

/**
 * Centralized Query Key Constants
 * Provides type-safe query keys for TanStack Query
 * Prevents typos and enables easy refactoring
 *
 * @remarks
 * All query keys are defined as readonly tuples using `as const`
 * to ensure type safety and immutability.
 *
 * Design Pattern: Constants Object Pattern
 * - Centralizes magic strings into single location
 * - Enables IDE autocomplete and type checking
 * - Simplifies query invalidation patterns
 *
 * @example
 * ```typescript
 * // Instead of: queryKey: ["logs"]
 * queryKey: QueryKeys.logs.all
 *
 * // Instead of: queryKey: ["users", "paged", filter]
 * queryKey: QueryKeys.users.paged(filter)
 * ```
 */
export const QueryKeys: QueryKeysType = {
	/**
	 * Query keys for log-related queries
	 */
	logs: {
		/** Base key for all log queries - use for invalidation */
		all: ["logs"] as const,

		/** Key for paged log queries with filter */
		paged: (filter: unknown): readonly unknown[] =>
			["logs", filter] as const,

		/** Key for log count queries with filter */
		count: (filter: unknown): readonly unknown[] =>
			["logs", "count", filter] as const
	},

	/**
	 * Query keys for user-related queries
	 */
	users: {
		/** Base key for all user queries - use for invalidation */
		all: ["users"] as const,

		/** Key for paged user queries with filter */
		paged: (filter: unknown): readonly unknown[] =>
			["users", "paged", filter] as const,

		/** Key for single user queries by ID */
		single: (id: number | string): readonly unknown[] =>
			["users", "user", id] as const,

		/** Key for user queries by username */
		byUsername: (username: string): readonly unknown[] =>
			["users", "username", username] as const
	}
} as const;
