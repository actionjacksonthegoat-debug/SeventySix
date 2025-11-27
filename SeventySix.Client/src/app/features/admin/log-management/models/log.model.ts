/**
 * Log entry model matching backend LogResponse DTO
 */
export interface LogResponse
{
	id: number;
	createDate: Date;
	logLevel: string;
	message: string;
	exceptionMessage: string | null;
	baseExceptionMessage: string | null;
	stackTrace: string | null;
	sourceContext: string | null;
	requestMethod: string | null;
	requestPath: string | null;
	statusCode: number | null;
	durationMs: number | null;
	properties: string | null;
	machineName: string | null;
	environment: string | null;
	correlationId: string | null;
	spanId: string | null;
	parentSpanId: string | null;
}

/**
 * Log level enumeration
 */
export enum LogLevel
{
	Verbose = 0,
	Debug = 1,
	Information = 2,
	Warning = 3,
	Error = 4,
	Fatal = 5
}

/**
 * Convert string log level from API to LogLevel enum
 */
export function parseLogLevel(logLevel: string): LogLevel
{
	switch (logLevel?.toLowerCase())
	{
		case "verbose":
			return LogLevel.Verbose;
		case "debug":
			return LogLevel.Debug;
		case "information":
		case "info":
			return LogLevel.Information;
		case "warning":
		case "warn":
			return LogLevel.Warning;
		case "error":
			return LogLevel.Error;
		case "fatal":
		case "critical":
			return LogLevel.Fatal;
		default:
			return LogLevel.Information;
	}
}

/**
 * Helper to get display name for log level
 */
export function getLogLevelDisplayName(level: LogLevel): string
{
	switch (level)
	{
		case LogLevel.Verbose:
			return "Verbose";
		case LogLevel.Debug:
			return "Debug";
		case LogLevel.Information:
			return "Information";
		case LogLevel.Warning:
			return "Warning";
		case LogLevel.Error:
			return "Error";
		case LogLevel.Fatal:
			return "Fatal";
		default:
			return "Unknown";
	}
}

/**
 * Helper to get CSS class for log level
 */
export function getLogLevelClass(level: LogLevel): string
{
	switch (level)
	{
		case LogLevel.Verbose:
		case LogLevel.Debug:
			return "log-level-debug";
		case LogLevel.Information:
			return "log-level-info";
		case LogLevel.Warning:
			return "log-level-warning";
		case LogLevel.Error:
			return "log-level-error";
		case LogLevel.Fatal:
			return "log-level-fatal";
		default:
			return "";
	}
}

/**
 * Helper to get icon for log level
 */
export function getLogLevelIcon(level: LogLevel): string
{
	switch (level)
	{
		case LogLevel.Verbose:
		case LogLevel.Debug:
			return "bug_report";
		case LogLevel.Information:
			return "info";
		case LogLevel.Warning:
			return "warning";
		case LogLevel.Error:
			return "error";
		case LogLevel.Fatal:
			return "cancel";
		default:
			return "circle";
	}
}

/**
 * Convert LogLevel enum to string for API calls
 */
export function logLevelToString(level: LogLevel): string
{
	switch (level)
	{
		case LogLevel.Verbose:
			return "Verbose";
		case LogLevel.Debug:
			return "Debug";
		case LogLevel.Information:
			return "Information";
		case LogLevel.Warning:
			return "Warning";
		case LogLevel.Error:
			return "Error";
		case LogLevel.Fatal:
			return "Fatal";
		default:
			return "Information";
	}
}
