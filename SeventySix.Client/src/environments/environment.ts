import { Environment } from "./environment.interface";

export const environment: Environment =
	{
		production: true,
		version: "1.0.0",
		// Production: relative URL routed via reverse proxy (see nginx.conf).
		// Configure your reverse proxy to route /api/v1 to the backend API container.
		apiUrl: "/api/v1",
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
		// Observability URLs — empty by default in production.
		// Set to your deployed Jaeger/Prometheus/Grafana URLs if the observability stack is deployed.
		// These URLs are displayed in the developer tools page; they are not called by the app itself.
			jaegerUrl: "",
			prometheusUrl: "",
			grafanaUrl: "",
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
			enabled: false, // Enable only when a collector is deployed and otlpEndpoint is configured
			serviceName: "SeventySix.Client",
			serviceVersion: "1.0.0",
			otlpEndpoint: "", // Set to your OTLP collector URL when enabled
			sampleRate: 0.1 // 10% sampling
		},
		auth: {
			loginUrl: "/auth/login"
		}
	};