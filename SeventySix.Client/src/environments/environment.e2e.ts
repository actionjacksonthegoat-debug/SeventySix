import { CACHE_TIMING } from "@shared/constants/timing.constants";
import { ENVIRONMENT_DEFAULTS } from "./environment.defaults";
import { Environment } from "./environment.interface";

/**
 * E2E Test Environment Configuration
 * API calls are proxied through nginx (same-origin) to the Docker API container.
 * This eliminates cross-origin requests and Docker Desktop port-mapping latency.
 */
export const environment: Environment =
	{
		...ENVIRONMENT_DEFAULTS,
		production: false,
		version: "1.0.0-e2e",
		apiUrl: "/api/v1", // Proxied through nginx to api-e2e container (same-origin)
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
			pgAdminUrl: "http://localhost:5050",
			redisInsightUrl: "http://localhost:5540",
			dashboards: {
				systemOverview: "seventysix-system-overview",
				apiEndpoints: "seventysix-api-endpoints",
				valkeyCache: "seventysix-valkey"
			}
		},
		cache: {
			query: {
				default: {
					staleTime: CACHE_TIMING.STALE_5MIN,
					gcTime: CACHE_TIMING.GC_10MIN,
					retry: 3,
					refetchOnWindowFocus: false,
					refetchOnReconnect: false
				},
				users: {
					staleTime: CACHE_TIMING.STALE_5MIN,
					gcTime: CACHE_TIMING.GC_10MIN,
					retry: 3
				},
				logs: {
					staleTime: CACHE_TIMING.STALE_1MIN,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 3
				},
				health: {
					staleTime: CACHE_TIMING.STALE_30S,
					gcTime: CACHE_TIMING.GC_1MIN,
					retry: 1
				},
				thirdpartyrequests: {
					staleTime: CACHE_TIMING.STALE_5MIN,
					gcTime: CACHE_TIMING.GC_10MIN,
					retry: 3
				},
				account: {
					staleTime: CACHE_TIMING.STALE_5MIN,
					gcTime: CACHE_TIMING.GC_10MIN,
					retry: 3
				},
				permissionrequests: {
					staleTime: CACHE_TIMING.STALE_5MIN,
					gcTime: CACHE_TIMING.GC_10MIN,
					retry: 3
				}
			}
		},
		// Override: disable performance monitoring in E2E to avoid interfering with test assertions
		ui: {
			...ENVIRONMENT_DEFAULTS.ui,
			performance: {
				enableMonitoring: false,
				fpsWarningThreshold: 30
			}
		},
		testing: {
			runIntegrationTests: false
		},
		telemetry: {
			enabled: false,
			serviceName: "SeventySix.Client.E2E",
			serviceVersion: "1.0.0-e2e",
			otlpEndpoint: "https://localhost:4319/v1/traces",
			sampleRate: 0
		},
		auth: {
			loginUrl: "/auth/login"
		}
	};