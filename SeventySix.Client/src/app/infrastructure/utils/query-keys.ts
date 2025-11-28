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

interface QueryKeysType
{
	readonly logs: LogQueryKeys;
	readonly users: UserQueryKeys;
	readonly health: HealthQueryKeys;
	readonly thirdPartyApi: ThirdPartyApiQueryKeys;
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
			["users", "username", username] as const
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
	}
} as const;
