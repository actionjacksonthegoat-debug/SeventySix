interface Environment
{
	production: boolean;
	apiUrl: string;
	logging: {
		enableRemoteLogging: boolean;
		batchSize: number;
		batchInterval: number;
		maxQueueSize: number;
		maxRetryCount: number;
		circuitBreakerThreshold: number;
		circuitBreakerTimeout: number;
	};
	cache: {
		query: {
			default: {
				staleTime: number;
				gcTime: number;
				retry: number;
				refetchOnWindowFocus: boolean;
				refetchOnReconnect: boolean;
			};
			weather: {
				staleTime: number;
				gcTime: number;
				retry: number;
			};
			users: {
				staleTime: number;
				gcTime: number;
				retry: number;
			};
			logs: {
				staleTime: number;
				gcTime: number;
				retry: number;
			};
			health: {
				staleTime: number;
				gcTime: number;
				retry: number;
			};
		};
	};
}

export const environment: Environment = {
	production: true,
	apiUrl: "https://localhost:7074/api", // Default API URL for production
	logging: {
		enableRemoteLogging: true,
		batchSize: 10,
		batchInterval: 5000, // 5 seconds
		maxQueueSize: 100,
		maxRetryCount: 3,
		circuitBreakerThreshold: 5,
		circuitBreakerTimeout: 30000 // 30 seconds
	},
	cache: {
		query: {
			// Global defaults
			default: {
				staleTime: 30000, // 30s - Consider fresh
				gcTime: 300000, // 5min - Keep in memory
				retry: 3,
				refetchOnWindowFocus: true,
				refetchOnReconnect: true
			},
			// Resource-specific overrides
			weather: {
				staleTime: 300000, // 5min
				gcTime: 600000, // 10min
				retry: 2
			},
			users: {
				staleTime: 60000, // 1min
				gcTime: 300000, // 5min
				retry: 3
			},
			logs: {
				staleTime: 30000, // 30s
				gcTime: 300000, // 5min
				retry: 2
			},
			health: {
				staleTime: 10000, // 10s
				gcTime: 60000, // 1min
				retry: 1
			}
		}
	}
};
