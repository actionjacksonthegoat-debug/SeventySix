import { Environment } from "./environment.interface";

export const environment: Environment =
	{
		production: true,
		version: "1.0.0",
		// Production: baked at build time. For deployment behind a reverse proxy,
		// change to "/api/v1" (relative) and add a proxy_pass rule in nginx.conf.
		apiUrl: "https://localhost:7074/api/v1",
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
			// pgAdminUrl and redisInsightUrl omitted — services not deployed in production
			dashboards: {
				systemOverview: "seventysix-system-overview",
				apiEndpoints: "seventysix-api-endpoints",
				valkeyCache: "seventysix-valkey"
			}
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
					staleTime: 60_000, // 1min
					gcTime: 300_000, // 5min
					retry: 1
				},
				thirdpartyrequests: {
					staleTime: 60000, // 1min
					gcTime: 300000, // 5min
					retry: 2
				},
				account: {
					staleTime: 120000, // 2min - User profile changes infrequently
					gcTime: 600000, // 10min
					retry: 2
				},
				permissionrequests: {
					staleTime: 60000, // 1min
					gcTime: 300000, // 5min
					retry: 2
				}
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
			defaultTimeout: 30000 // 30 seconds
		},
		testing: {
			runIntegrationTests: false
		},
		telemetry: {
			enabled: true,
			serviceName: "SeventySix.Client",
			serviceVersion: "1.0.0",
			otlpEndpoint: "https://localhost:4319/v1/traces",
			sampleRate: 0.1 // 10% sampling for production
		},
		auth: {
			loginUrl: "/auth/login",
			tokenRefreshBufferSeconds: 60 // Refresh token 60s before expiry
		},
		altcha: {
			enabled: true
		}
	};
