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
	observability: {
		jaegerUrl: string;
		prometheusUrl: string;
		enabled: boolean;
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
			weather: { staleTime: number; gcTime: number; retry: number };
			users: { staleTime: number; gcTime: number; retry: number };
			logs: { staleTime: number; gcTime: number; retry: number };
			health: { staleTime: number; gcTime: number; retry: number };
			logcharts: { staleTime: number; gcTime: number; retry: number };
			thirdpartyrequests: {
				staleTime: number;
				gcTime: number;
				retry: number;
			};
		};
	};
	dashboard: {
		health: {
			autoRefreshEnabled: boolean;
			refreshIntervalSeconds: number;
		};
	};
	testing: {
		runIntegrationTests: boolean;
	};
}

/**
 * Test Environment Configuration
 * Uses port :1234 to ensure tests never hit real API endpoints
 * Integration tests are disabled by default
 */
export const environment: Environment = {
	production: false,
	apiUrl: "http://localhost:1234/api/v1", // API v1 - Test-only port to prevent hitting real API
	logging: {
		enableRemoteLogging: false, // Disable remote logging in tests
		batchSize: 10,
		batchInterval: 250, // Fast enough for tests but prevents race conditions
		maxQueueSize: 100,
		maxRetryCount: 1, // Minimal retries in tests
		circuitBreakerThreshold: 3, // Lower threshold for faster tests
		circuitBreakerTimeout: 1000 // Faster timeout (1s instead of 30s)
	},
	observability: {
		jaegerUrl: "http://localhost:16686",
		prometheusUrl: "http://localhost:9090",
		enabled: false // Disabled in tests
	},
	cache: {
		query: {
			default: {
				staleTime: 0, // No caching in tests
				gcTime: 0,
				retry: 0, // No retries in tests
				refetchOnWindowFocus: false,
				refetchOnReconnect: false
			},
			weather: { staleTime: 0, gcTime: 0, retry: 0 },
			users: { staleTime: 0, gcTime: 0, retry: 0 },
			logs: { staleTime: 0, gcTime: 0, retry: 0 },
			health: { staleTime: 0, gcTime: 0, retry: 0 },
			logcharts: { staleTime: 0, gcTime: 0, retry: 0 },
			thirdpartyrequests: { staleTime: 0, gcTime: 0, retry: 0 }
		}
	},
	dashboard: {
		health: {
			autoRefreshEnabled: false, // Disabled in tests
			refreshIntervalSeconds: 60
		}
	},
	testing: {
		runIntegrationTests: false // Integration tests disabled by default
	}
};
