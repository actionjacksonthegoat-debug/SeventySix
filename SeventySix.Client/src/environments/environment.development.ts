import { Environment } from "./environment.interface";

export const environment: Environment =
	{
		production: false,
		version: "1.0.0-dev",
		apiUrl: "https://localhost:7074/api/v1", // HTTPS for local development with HTTP/2 support
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
			// Observability stack URLs (via HTTPS nginx-proxy)
			jaegerUrl: "https://localhost:16687", // Jaeger UI for distributed tracing
			prometheusUrl: "https://localhost:9091", // Prometheus for metrics
			grafanaUrl: "https://localhost:3443", // Grafana for metrics visualization
			dashboards: {
				systemOverview: "seventysix-system-overview",
				apiEndpoints: "seventysix-api-endpoints",
				valkeyCache: "seventysix-valkey"
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
				thirdpartyrequests: { staleTime: 0, gcTime: 60000, retry: 1 },
				account: { staleTime: 0, gcTime: 60000, retry: 1 },
				permissionrequests: { staleTime: 0, gcTime: 60000, retry: 1 }
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
		http: {
			defaultTimeout: 30000, // 30 seconds
			uploadTimeout: 120000 // 2 minutes for file uploads
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
			otlpEndpoint: "https://localhost:4319/v1/traces",
			sampleRate: 1.0 // 100% sampling for development
		},
		auth: {
			loginUrl: "/auth/login",
			tokenRefreshBufferSeconds: 60 // Refresh 60 seconds before expiry
		},
		altcha: {
			enabled: false // Disabled in development
		}
	};
