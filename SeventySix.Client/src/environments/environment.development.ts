interface Environment
{
	production: boolean;
	apiUrl: string;
	logging: {
		enableRemoteLogging: boolean;
		consoleLogLevel: "debug" | "info" | "warn" | "error" | "none";
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
		dashboards: {
			systemOverview: string;
			apiEndpoints: string;
		};
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
			users: { staleTime: number; gcTime: number; retry: number };
			logs: { staleTime: number; gcTime: number; retry: number };
			health: { staleTime: number; gcTime: number; retry: number };
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
	ui: {
		tables: {
			defaultPageSize: number;
			pageSizeOptions: number[];
			virtualScrollItemSize: number;
		};
		performance: {
			enableMonitoring: boolean;
			fpsWarningThreshold: number;
		};
	};
	dateTime: {
		defaultDisplayFormat: string;
		inputFormat: string;
		timeFormat: string;
		relativeTimeThreshold: number;
		timezoneMode: "utc" | "local";
	};
	testing: {
		runIntegrationTests: boolean;
	};
	telemetry: {
		enabled: boolean;
		serviceName: string;
		serviceVersion: string;
		otlpEndpoint: string;
		sampleRate: number;
	};
}

export const environment: Environment = {
	production: false,
	apiUrl: "http://localhost:5085/api/v1", // API v1 - HTTP for local development (use https://localhost:7074/api/v1 for docker-compose)
	logging: {
		enableRemoteLogging: true,
		consoleLogLevel: "warn", // Only show warnings and errors in console
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
		dashboards: {
			systemOverview: "seventysix-system-overview",
			apiEndpoints: "seventysix-api-endpoints"
		}
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
			users: { staleTime: 0, gcTime: 60000, retry: 1 },
			logs: { staleTime: 0, gcTime: 60000, retry: 1 },
			health: { staleTime: 0, gcTime: 60000, retry: 1 },
			thirdpartyrequests: { staleTime: 0, gcTime: 60000, retry: 1 }
		}
	},
	dashboard: {
		health: {
			autoRefreshEnabled: true,
			refreshIntervalSeconds: 30 // 30 seconds in development for faster feedback
		}
	},
	ui: {
		tables: {
			defaultPageSize: 50,
			pageSizeOptions: [25, 50, 100],
			virtualScrollItemSize: 48
		},
		performance: {
			enableMonitoring: true,
			fpsWarningThreshold: 30
		}
	},
	dateTime: {
		defaultDisplayFormat: "yyyy-MM-dd HH:mm:ss",
		inputFormat: "yyyy-MM-dd",
		timeFormat: "HH:mm:ss",
		relativeTimeThreshold: 86400000, // 24 hours in milliseconds
		timezoneMode: "local"
	},
	testing: {
		runIntegrationTests: false
	},
	telemetry: {
		enabled: true,
		serviceName: "SeventySix.Client",
		serviceVersion: "1.0.0",
		otlpEndpoint: "http://localhost:4318/v1/traces",
		sampleRate: 1.0 // 100% sampling for development
	}
};
