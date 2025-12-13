interface LogQueryKeys
{
	readonly all: readonly ["logs"];
	readonly paged: (filter: unknown) => readonly unknown[];
	readonly count: (filter: unknown) => readonly unknown[];
}

interface UserQueryKeys
{
	readonly all: readonly ["users"];
	readonly paged: (filter: unknown) => readonly unknown[];
	readonly single: (id: number | string) => readonly unknown[];
	readonly byUsername: (username: string) => readonly unknown[];
	readonly roles: (userId: number | string) => readonly unknown[];
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
	readonly byName: (name: string) => readonly unknown[];
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

export const QueryKeys: QueryKeysType = {
	logs: {
		all: ["logs"] as const,
		paged: (filter: unknown): readonly unknown[] =>
			["logs", filter] as const,
		count: (filter: unknown): readonly unknown[] =>
			["logs", "count", filter] as const
	},

	users: {
		all: ["users"] as const,
		paged: (filter: unknown): readonly unknown[] =>
			["users", "paged", filter] as const,
		single: (id: number | string): readonly unknown[] =>
			["users", "user", id] as const,
		byUsername: (username: string): readonly unknown[] =>
			["users", "username", username] as const,
		roles: (userId: number | string): readonly unknown[] =>
			["users", userId, "roles"] as const
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
		byName: (name: string): readonly unknown[] =>
			["thirdPartyApi", "byName", name] as const,
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
