import { CACHE_TIMING } from "@shared/constants/timing.constants";
import { ENVIRONMENT_DEFAULTS } from "./environment.defaults";
import { Environment } from "./environment.interface";

export const environment: Environment =
	{
		...ENVIRONMENT_DEFAULTS,
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
					staleTime: CACHE_TIMING.STALE_30S,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 3,
					refetchOnWindowFocus: true,
					refetchOnReconnect: true
				},
				// Resource-specific overrides
				users: {
					staleTime: CACHE_TIMING.STALE_1MIN,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 3
				},
				logs: {
					staleTime: CACHE_TIMING.STALE_30S,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 2
				},
				health: {
					staleTime: CACHE_TIMING.STALE_1MIN,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 1
				},
				thirdpartyrequests: {
					staleTime: CACHE_TIMING.STALE_1MIN,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 2
				},
				account: {
					staleTime: CACHE_TIMING.STALE_2MIN, // User profile changes infrequently
					gcTime: CACHE_TIMING.GC_10MIN,
					retry: 2
				},
				permissionrequests: {
					staleTime: CACHE_TIMING.STALE_1MIN,
					gcTime: CACHE_TIMING.GC_5MIN,
					retry: 2
				}
			}
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