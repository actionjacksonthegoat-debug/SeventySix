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
		};
	};
}

export const environment: Environment = {
	production: false,
	apiUrl: "https://localhost:7074/api", // HTTPS for docker-compose (use http://localhost:5085/api for Container debugging)
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
		// Observability stack URLs (Jaeger + Prometheus)
		jaegerUrl: "http://localhost:16686", // Jaeger UI for distributed tracing
		prometheusUrl: "http://localhost:9090", // Prometheus for metrics
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
			health: { staleTime: 0, gcTime: 60000, retry: 1 }
		}
	}
};
