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
		grafanaUrl: string;
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

export const environment: Environment = {
	production: false,
	apiUrl: "http://localhost:5085/api/v1", // API v1 - HTTP for local development (use https://localhost:7074/api/v1 for docker-compose)
	logging: {
		enableRemoteLogging: true,
		batchSize: 10,
		batchInterval: 5000, // 5 seconds
		maxQueueSize: 100,
		maxRetryCount: 3,
		circuitBreakerThreshold: 5,
		circuitBreakerTimeout: 30000 // 30 seconds
	},
	observability: {
		// Observability stack URLs (Jaeger + Prometheus + Grafana)
		jaegerUrl: "http://localhost:16686", // Jaeger UI for distributed tracing
		prometheusUrl: "http://localhost:9090", // Prometheus for metrics
		grafanaUrl: "http://localhost:3000", // Grafana for metrics visualization
		enabled: true // Set to true when observability stack is deployed
	},
	cache: {
		query: {
			default: {
				staleTime: 0, // Always stale in dev
				gcTime: 60000, // 1min in dev
				retry: 1,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false
			},
			weather: { staleTime: 0, gcTime: 60000, retry: 1 },
			users: { staleTime: 0, gcTime: 60000, retry: 1 },
			logs: { staleTime: 0, gcTime: 60000, retry: 1 },
			health: { staleTime: 0, gcTime: 60000, retry: 1 },
			logcharts: { staleTime: 0, gcTime: 60000, retry: 1 },
			thirdpartyrequests: { staleTime: 0, gcTime: 60000, retry: 1 }
		}
	},
	dashboard: {
		health: {
			autoRefreshEnabled: true,
			refreshIntervalSeconds: 30 // 30 seconds in development for faster feedback
		}
	},
	testing: {
		runIntegrationTests: false
	}
};
