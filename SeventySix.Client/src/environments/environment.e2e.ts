import { Environment } from "./environment.interface";

/**
 * E2E Test Environment Configuration
 * Uses Docker container API on HTTP port 5086
 */
export const environment: Environment =
	{
		production: false,
		version: "1.0.0-e2e",
		apiUrl: "http://localhost:5086/api/v1", // Docker E2E API container (HTTP, isolated from dev)
		logging: {
			enableRemoteLogging: false,
			consoleLogLevel: "debug",
			batchSize: 10,
			batchInterval: 5000,
			maxQueueSize: 100,
			maxRetryCount: 3,
			circuitBreakerThreshold: 5,
			circuitBreakerTimeout: 30000
		},
		observability: {
			jaegerUrl: "http://localhost:16686",
			prometheusUrl: "http://localhost:9090",
			grafanaUrl: "http://localhost:3000",
			dashboards: {
				systemOverview: "seventysix-system-overview",
				apiEndpoints: "seventysix-api-endpoints",
				valkeyCache: "seventysix-valkey"
			}
		},
		cache: {
			query: {
				default: {
					staleTime: 300000,
					gcTime: 600000,
					retry: 3,
					refetchOnWindowFocus: false,
					refetchOnReconnect: false
				},
				users: {
					staleTime: 300000,
					gcTime: 600000,
					retry: 3
				},
				logs: {
					staleTime: 60000,
					gcTime: 300000,
					retry: 3
				},
				health: {
					staleTime: 30000,
					gcTime: 60000,
					retry: 1
				},
				thirdpartyrequests: {
					staleTime: 300000,
					gcTime: 600000,
					retry: 3
				},
				account: {
					staleTime: 300000,
					gcTime: 600000,
					retry: 3
				},
				permissionrequests: {
					staleTime: 300000,
					gcTime: 600000,
					retry: 3
				}
			}
		},
		dashboard: {
			health: {
				autoRefreshEnabled: false,
				refreshIntervalSeconds: 60
			}
		},
		ui: {
			tables: {
				defaultPageSize: 50,
				pageSizeOptions: [25, 50, 100],
				virtualScrollItemSize: 48
			},
			performance: {
				enableMonitoring: false,
				fpsWarningThreshold: 30
			}
		},
		http: {
			defaultTimeout: 30000,
			uploadTimeout: 120000
		},
		dateTime: {
			defaultDisplayFormat: "yyyy-MM-dd HH:mm:ss",
			inputFormat: "yyyy-MM-dd",
			timeFormat: "HH:mm:ss",
			relativeTimeThreshold: 86400000,
			timezoneMode: "local"
		},
		testing: {
			runIntegrationTests: false
		},
		telemetry: {
			enabled: false,
			serviceName: "SeventySix.Client.E2E",
			serviceVersion: "1.0.0-e2e",
			otlpEndpoint: "http://localhost:4318/v1/traces",
			sampleRate: 0
		},
		auth: {
			loginUrl: "/auth/login",
			tokenRefreshBufferSeconds: 60
		},
		altcha: {
			enabled: false
		}
	};
