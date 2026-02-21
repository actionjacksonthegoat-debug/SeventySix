import { ENVIRONMENT_DEFAULTS } from "./environment.defaults";
import { Environment } from "./environment.interface";

/**
 * Test Environment Configuration
 * Uses port :1234 to ensure tests never hit real API endpoints
 * Integration tests are disabled by default
 */
export const environment: Environment =
	{
		...ENVIRONMENT_DEFAULTS,
		production: false,
		version: "1.0.0-test",
		apiUrl: "http://localhost:1234/api/v1", // API v1 - Test-only port to prevent hitting real API
		logging: {
			enableRemoteLogging: false, // Disable remote logging in tests
			consoleLogLevel: "debug", // Allow all log levels in tests for verification
			batchSize: 10,
			batchInterval: 250, // Fast enough for tests but prevents race conditions
			maxQueueSize: 100,
			maxRetryCount: 1, // Minimal retries in tests
			circuitBreakerThreshold: 3, // Lower threshold for faster tests
			circuitBreakerTimeout: 1000 // Faster timeout (1s instead of 30s)
		},
		observability: {
			jaegerUrl: "https://localhost:16687",
			prometheusUrl: "https://localhost:9091",
			grafanaUrl: "https://localhost:3443",
			pgAdminUrl: "https://localhost:5051",
			redisInsightUrl: "https://localhost:5541",
			enabled: false, // Disabled in tests
			dashboards: {
				systemOverview: "seventysix-system-overview",
				apiEndpoints: "seventysix-api-endpoints",
				valkeyCache: "seventysix-valkey"
			}
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
				users: { staleTime: 0, gcTime: 0, retry: 0 },
				logs: { staleTime: 0, gcTime: 0, retry: 0 },
				health: { staleTime: 0, gcTime: 0, retry: 0 },
				thirdpartyrequests: { staleTime: 0, gcTime: 0, retry: 0 },
				account: { staleTime: 0, gcTime: 0, retry: 0 },
				permissionrequests: { staleTime: 0, gcTime: 0, retry: 0 }
			}
		},
		// Override: disable performance monitoring in unit tests
		ui: {
			...ENVIRONMENT_DEFAULTS.ui,
			performance: {
				enableMonitoring: false, // Disabled in tests
				fpsWarningThreshold: 30
			}
		},
		// Override: shorter timeout for faster test feedback
		http: {
			defaultTimeout: 5000 // 5 seconds - shorter for tests
		},
		testing: {
			runIntegrationTests: false // Integration tests disabled by default
		},
		telemetry: {
			enabled: false, // Disabled in tests
			serviceName: "SeventySix.Client.Test",
			serviceVersion: "1.0.0",
			otlpEndpoint: "http://localhost:4318/v1/traces",
			sampleRate: 0 // No sampling in tests
		},
		auth: {
			loginUrl: "/auth/login"
		}
	};