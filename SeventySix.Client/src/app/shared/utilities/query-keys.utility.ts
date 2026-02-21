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
	 * @param {number | string} userId
	 * Returns a query key for a single user by id.
	 * @returns {QueryKeyElement[]}
	 */
	readonly single: (userId: number | string) => QueryKeyElement[];

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

	/**
	 * @type {readonly ["users", "adminCount"]}
	 * Key representing the count of admin users.
	 * Used to determine if Admin role removal should be disabled.
	 */
	readonly adminCount: readonly ["users", "adminCount"];
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
	 * Key representing a minimal public health status check.
	 */
	readonly status: readonly ["health", "status"];

	/**
	 * @type {readonly ["health", "detailed"]}
	 * Key representing detailed infrastructure health checks.
	 */
	readonly detailed: readonly ["health", "detailed"];

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
	 * @type {readonly ["thirdPartyApi", "list"]}
	 * Key for listing all third party APIs.
	 */
	readonly list: readonly ["thirdPartyApi", "list"];

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
	 * @type {readonly ["account", "availableRoles"]}
	 * Key representing available roles for the current account.
	 */
	readonly availableRoles: readonly ["account", "availableRoles"];

	/**
	 * @type {readonly ["account", "permissionRequest"]}
	 * Key representing permission request resources.
	 */
	readonly permissionRequest: readonly ["account", "permissionRequest"];

	/**
	 * @type {readonly ["account", "externalLogins"]}
	 * Key representing linked external OAuth logins.
	 */
	readonly externalLogins: readonly ["account", "externalLogins"];
}

/**
 * Query keys for permission request resources.
 */
interface PermissionRequestQueryKeys
{
	/**
	 * @type {readonly ["permissionRequests"]}
	 * Constant key representing permission-requests.
	 */
	readonly all: readonly ["permissionRequests"];

	/**
	 * @type {readonly ["permissionRequests", "list"]}
	 * Key for listing all permission requests.
	 */
	readonly list: readonly ["permissionRequests", "list"];

	/**
	 * @type {readonly ["permissionRequests", "availableRoles"]}
	 * Key representing available roles for permission requests.
	 */
	readonly availableRoles: readonly ["permissionRequests", "availableRoles"];
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
 * Pattern: [resource, operation, ...params] for all dynamic keys.
 *
 * @type {QueryKeysType}
 */
export const QueryKeys: QueryKeysType =
	{
		logs: {
			all: ["logs"] as const,
			paged: (filter: BaseQueryRequest): QueryKeyElement[] =>
				["logs", "paged", filter],
			count: (filter: BaseQueryRequest): QueryKeyElement[] =>
				["logs", "count", filter]
		},

		users: {
			all: ["users"] as const,
			paged: (filter: BaseQueryRequest): QueryKeyElement[] =>
				["users", "paged", filter],
			single: (userId: number | string): QueryKeyElement[] =>
				["users", "single", userId],
			byUsername: (username: string): QueryKeyElement[] =>
				["users", "byUsername", username],
			roles: (userId: number | string): QueryKeyElement[] =>
				["users", "roles", userId],
			adminCount: ["users", "adminCount"] as const
		},

		health: {
			all: ["health"] as const,
			status: ["health", "status"] as const,
			detailed: ["health", "detailed"] as const,
			scheduledJobs: ["health", "scheduledJobs"] as const
		},

		thirdPartyApi: {
			all: ["thirdPartyApi"] as const,
			list: ["thirdPartyApi", "list"] as const,
			statistics: ["thirdPartyApi", "statistics"] as const
		},

		account: {
			all: ["account"] as const,
			profile: ["account", "profile"] as const,
			availableRoles: ["account", "availableRoles"] as const,
			permissionRequest: ["account", "permissionRequest"] as const,
			externalLogins: ["account", "externalLogins"] as const
		},

		permissionRequests: {
			all: ["permissionRequests"] as const,
			list: ["permissionRequests", "list"] as const,
			availableRoles: ["permissionRequests", "availableRoles"] as const
		}
	} as const;