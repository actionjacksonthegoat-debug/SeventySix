import { BaseQueryRequest } from "@shared/models";

/**
 * Single element type used when constructing query keys.
 *
 * This type represents the allowed primitives and request objects that can be
 * included in a TanStack Query key for a resource.
 *
 * @example
 * // Valid elements: 'users', 5, true, { page: 1, pageSize: 25 }
 *
 * @type {string | number | boolean | BaseQueryRequest}
 */
type QueryKeyElement = string | number | boolean | BaseQueryRequest;

/**
 * Helpers and constants to construct query keys for the `logs` resource.
 */
interface LogQueryKeys
{
	/**
	 * @type {readonly ["logs"]}
	 * Constant key representing all logs.
	 */
	readonly all: readonly ["logs"];

	/**
	 * @param {BaseQueryRequest} filter
	 * Returns a query key for a paged logs request.
	 * @returns {QueryKeyElement[]}
	 */
	readonly paged: (filter: BaseQueryRequest) => QueryKeyElement[];

	/**
	 * @param {BaseQueryRequest} filter
	 * Returns a query key for log counts for the provided filter.
	 * @returns {QueryKeyElement[]}
	 */
	readonly count: (filter: BaseQueryRequest) => QueryKeyElement[];
}

/**
 * Helpers and constants to construct query keys for the `users` resource.
 */
interface UserQueryKeys
{
	/**
	 * @type {readonly ["users"]}
	 * Constant key representing all users.
	 */
	readonly all: readonly ["users"];

	/**
	 * @param {BaseQueryRequest} filter
	 * Returns a query key for a paged users request.
	 * @returns {QueryKeyElement[]}
	 */
	readonly paged: (filter: BaseQueryRequest) => QueryKeyElement[];

	/**
	 * @param {number | string} id
	 * Returns a query key for a single user by id.
	 * @returns {QueryKeyElement[]}
	 */
	readonly single: (id: number | string) => QueryKeyElement[];

	/**
	 * @param {string} username
	 * Returns a query key for a single user by username.
	 * @returns {QueryKeyElement[]}
	 */
	readonly byUsername: (username: string) => QueryKeyElement[];

	/**
	 * @param {number | string} userId
	 * Returns a query key representing the roles for a user.
	 * @returns {QueryKeyElement[]}
	 */
	readonly roles: (userId: number | string) => QueryKeyElement[];
}

/**
 * Query keys for the application's health endpoints.
 */
interface HealthQueryKeys
{
	/**
	 * @type {readonly ["health"]}
	 * Constant key representing general health checks.
	 */
	readonly all: readonly ["health"];

	/**
	 * @type {readonly ["health", "status"]}
	 * Key representing a health status check.
	 */
	readonly status: readonly ["health", "status"];

	/**
	 * @type {readonly ["health", "database"]}
	 * Key representing database health checks.
	 */
	readonly database: readonly ["health", "database"];

	/**
	 * @type {readonly ["health", "externalApis"]}
	 * Key representing external API health checks.
	 */
	readonly externalApis: readonly ["health", "externalApis"];

	/**
	 * @type {readonly ["health", "scheduledJobs"]}
	 * Key representing scheduled background job health checks.
	 */
	readonly scheduledJobs: readonly ["health", "scheduledJobs"];
}

/**
 * Query keys and helpers for third party API resources.
 */
interface ThirdPartyApiQueryKeys
{
	/**
	 * @type {readonly ["thirdPartyApi"]}
	 * Constant key representing third party APIs.
	 */
	readonly all: readonly ["thirdPartyApi"];

	/**
	 * @type {readonly ["thirdPartyApi", "all"]}
	 * Key for listing all third party APIs.
	 */
	readonly list: readonly ["thirdPartyApi", "all"];

	/**
	 * @param {string} name
	 * Returns a query key for a third party API by name.
	 * @returns {QueryKeyElement[]}
	 */
	readonly byName: (name: string) => QueryKeyElement[];

	/**
	 * @type {readonly ["thirdPartyApi", "statistics"]}
	 * Key to fetch statistics for third party APIs.
	 */
	readonly statistics: readonly ["thirdPartyApi", "statistics"];
}

/**
 * Query keys for account-related resources.
 */
interface AccountQueryKeys
{
	/**
	 * @type {readonly ["account"]}
	 * Constant key representing account resources.
	 */
	readonly all: readonly ["account"];

	/**
	 * @type {readonly ["account", "profile"]}
	 * Key representing profile retrieval.
	 */
	readonly profile: readonly ["account", "profile"];

	/**
	 * @type {readonly ["account", "available-roles"]}
	 * Key representing available roles for the current account.
	 */
	readonly availableRoles: readonly ["account", "available-roles"];

	/**
	 * @type {readonly ["account", "permission-request"]}
	 * Key representing permission request resources.
	 */
	readonly permissionRequest: readonly ["account", "permission-request"];
}

/**
 * Query keys for permission request resources.
 */
interface PermissionRequestQueryKeys
{
	/**
	 * @type {readonly ["permission-requests"]}
	 * Constant key representing permission-requests.
	 */
	readonly all: readonly ["permission-requests"];

	/**
	 * @type {readonly ["permission-requests", "all"]}
	 * Key for listing all permission requests.
	 */
	readonly list: readonly ["permission-requests", "all"];

	/**
	 * @type {readonly ["permission-requests", "available-roles"]}
	 * Key representing available roles for permission requests.
	 */
	readonly availableRoles: readonly ["permission-requests", "available-roles"];
}

/**
 * Top-level shape describing all available query key groups.
 *
 * Each property provides helpers or constant tuples for constructing
 * type-safe query keys for a specific resource.
 */
interface QueryKeysType
{
	/** @type {LogQueryKeys} */ readonly logs: LogQueryKeys;
	/** @type {UserQueryKeys} */ readonly users: UserQueryKeys;
	/** @type {HealthQueryKeys} */ readonly health: HealthQueryKeys;
	/** @type {ThirdPartyApiQueryKeys} */ readonly thirdPartyApi: ThirdPartyApiQueryKeys;
	/** @type {AccountQueryKeys} */ readonly account: AccountQueryKeys;
	/** @type {PermissionRequestQueryKeys} */ readonly permissionRequests: PermissionRequestQueryKeys;
}

/**
 * Centralized collection of typed query keys and helpers.
 *
 * Use these helpers to construct TanStack Query keys in a consistent and
 * type-safe manner across the application.
 *
 * @type {QueryKeysType}
 */
export const QueryKeys: QueryKeysType =
	{
		logs: {
			all: ["logs"] as const,
			paged: (filter: BaseQueryRequest): QueryKeyElement[] =>
				["logs", filter],
			count: (filter: BaseQueryRequest): QueryKeyElement[] =>
				["logs", "count", filter]
		},

		users: {
			all: ["users"] as const,
			paged: (filter: BaseQueryRequest): QueryKeyElement[] =>
				["users", "paged", filter],
			single: (id: number | string): QueryKeyElement[] =>
				["users", "user", id],
			byUsername: (username: string): QueryKeyElement[] =>
				["users", "username", username],
			roles: (userId: number | string): QueryKeyElement[] =>
				["users", userId, "roles"]
		},

		health: {
			all: ["health"] as const,
			status: ["health", "status"] as const,
			database: ["health", "database"] as const,
			externalApis: ["health", "externalApis"] as const,
			scheduledJobs: ["health", "scheduledJobs"] as const
		},

		thirdPartyApi: {
			all: ["thirdPartyApi"] as const,
			list: ["thirdPartyApi", "all"] as const,
			byName: (name: string): QueryKeyElement[] =>
				["thirdPartyApi", "byName", name],
			statistics: ["thirdPartyApi", "statistics"] as const
		},

		account: {
			all: ["account"] as const,
			profile: ["account", "profile"] as const,
			availableRoles: ["account", "available-roles"] as const,
			permissionRequest: ["account", "permission-request"] as const
		},

		permissionRequests: {
			all: ["permission-requests"] as const,
			list: ["permission-requests", "all"] as const,
			availableRoles: ["permission-requests", "available-roles"] as const
		}
	} as const;
