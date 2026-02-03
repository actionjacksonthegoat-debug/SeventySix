/**
 * Cache query configuration for a specific resource.
 * Used by TanStack Query for staleTime, gcTime, and retry settings.
 */
export interface CacheQueryConfig
{
	/** Time in ms before data is considered stale and triggers background refetch. */
	staleTime: number;
	/** Time in ms after last access before cache entry is garbage collected. */
	gcTime: number;
	/** Number of automatic retry attempts on query failure. */
	retry: number;
}

/**
 * Extended cache query configuration for default settings.
 * Includes global refetch behavior options.
 */
export interface CacheQueryDefaultConfig extends CacheQueryConfig
{
	/** Whether to refetch when window regains focus. */
	refetchOnWindowFocus: boolean;
	/** Whether to refetch when network reconnects. */
	refetchOnReconnect: boolean;
}

/**
 * Logging configuration for client-side error and telemetry logging.
 */
export interface LoggingConfig
{
	enableRemoteLogging: boolean;
	consoleLogLevel: "debug" | "info" | "warn" | "error" | "none";
	batchSize: number;
	batchInterval: number;
	maxQueueSize: number;
	maxRetryCount: number;
	circuitBreakerThreshold: number;
	circuitBreakerTimeout: number;
}

/**
 * Observability configuration for distributed tracing and metrics.
 */
export interface ObservabilityConfig
{
	jaegerUrl: string;
	prometheusUrl: string;
	grafanaUrl: string;
	pgAdminUrl: string;
	redisInsightUrl: string;
	/** Optional - used in test environment to disable observability. */
	enabled?: boolean;
	dashboards: {
		systemOverview: string;
		apiEndpoints: string;
		valkeyCache: string;
	};
}

/**
 * Cache configuration for TanStack Query.
 */
export interface CacheConfig
{
	query: {
		default: CacheQueryDefaultConfig;
		users: CacheQueryConfig;
		logs: CacheQueryConfig;
		health: CacheQueryConfig;
		thirdpartyrequests: CacheQueryConfig;
		account: CacheQueryConfig;
		permissionrequests: CacheQueryConfig;
	};
}

/**
 * Dashboard configuration settings.
 */
export interface DashboardConfig
{
	health: {
		autoRefreshEnabled: boolean;
		refreshIntervalSeconds: number;
	};
}

/**
 * UI configuration for tables and performance.
 */
export interface UiConfig
{
	tables: {
		defaultPageSize: number;
		pageSizeOptions: number[];
		virtualScrollItemSize: number;
	};
	performance: {
		enableMonitoring: boolean;
		fpsWarningThreshold: number;
	};
}

/**
 * HTTP configuration for request handling.
 */
export interface HttpConfig
{
	/** Default request timeout in milliseconds. */
	defaultTimeout: number;
	/** Extended timeout for file upload operations in milliseconds. */
	uploadTimeout: number;
}

/**
 * Date/time formatting configuration.
 */
export interface DateTimeConfig
{
	defaultDisplayFormat: string;
	inputFormat: string;
	timeFormat: string;
	relativeTimeThreshold: number;
	timezoneMode: "utc" | "local";
}

/**
 * Testing configuration.
 */
export interface TestingConfig
{
	runIntegrationTests: boolean;
}

/**
 * Telemetry/OpenTelemetry configuration.
 */
export interface TelemetryConfig
{
	enabled: boolean;
	serviceName: string;
	serviceVersion: string;
	otlpEndpoint: string;
	sampleRate: number;
}

/**
 * Authentication configuration.
 */
export interface AuthConfig
{
	loginUrl: string;
	tokenRefreshBufferSeconds: number;
}

/**
 * ALTCHA proof-of-work challenge configuration.
 */
export interface AltchaConfig
{
	/** Whether ALTCHA validation is enabled. */
	enabled: boolean;
}

/**
 * Complete environment configuration interface.
 * Shared across all environment files (production, development, test).
 */
export interface Environment
{
	production: boolean;
	version: string;
	apiUrl: string;
	logging: LoggingConfig;
	observability: ObservabilityConfig;
	cache: CacheConfig;
	dashboard: DashboardConfig;
	ui: UiConfig;
	http: HttpConfig;
	dateTime: DateTimeConfig;
	testing: TestingConfig;
	telemetry: TelemetryConfig;
	auth: AuthConfig;
	altcha: AltchaConfig;
}
