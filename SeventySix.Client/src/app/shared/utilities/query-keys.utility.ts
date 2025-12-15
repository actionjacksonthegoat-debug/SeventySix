import { BaseQueryRequest } from "@shared/models";

/** Query key element types for type-safe cache management */
type QueryKeyElement = string | number | boolean | BaseQueryRequest;

interface LogQueryKeys
{
	readonly all: readonly ["logs"];
	readonly paged: (filter: BaseQueryRequest) => QueryKeyElement[];
	readonly count: (filter: BaseQueryRequest) => QueryKeyElement[];
}

interface UserQueryKeys
{
	readonly all: readonly ["users"];
	readonly paged: (filter: BaseQueryRequest) => QueryKeyElement[];
	readonly single: (id: number | string) => QueryKeyElement[];
	readonly byUsername: (username: string) => QueryKeyElement[];
	readonly roles: (userId: number | string) => QueryKeyElement[];
}

interface HealthQueryKeys
{
	readonly all: readonly ["health"];
	readonly status: readonly ["health", "status"];
	readonly database: readonly ["health", "database"];
	readonly externalApis: readonly ["health", "externalApis"];
}

interface ThirdPartyApiQueryKeys
{
	readonly all: readonly ["thirdPartyApi"];
	readonly list: readonly ["thirdPartyApi", "all"];
	readonly byName: (name: string) => QueryKeyElement[];
	readonly statistics: readonly ["thirdPartyApi", "statistics"];
}

interface AccountQueryKeys
{
	readonly all: readonly ["account"];
	readonly profile: readonly ["account", "profile"];
	readonly availableRoles: readonly ["account", "available-roles"];
	readonly permissionRequest: readonly ["account", "permission-request"];
}

interface PermissionRequestQueryKeys
{
	readonly all: readonly ["permission-requests"];
	readonly list: readonly ["permission-requests", "all"];
	readonly availableRoles: readonly ["permission-requests", "available-roles"];
}

interface QueryKeysType
{
	readonly logs: LogQueryKeys;
	readonly users: UserQueryKeys;
	readonly health: HealthQueryKeys;
	readonly thirdPartyApi: ThirdPartyApiQueryKeys;
	readonly account: AccountQueryKeys;
	readonly permissionRequests: PermissionRequestQueryKeys;
}

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
			externalApis: ["health", "externalApis"] as const
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
