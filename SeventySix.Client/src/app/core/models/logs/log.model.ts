/**
 * Log entry model matching backend LogResponse DTO
 */
export interface LogResponse
{
	id: number;
	timestamp: Date;
	level: LogLevel;
	message: string;
	sourceContext: string | null;
	exception: string | null;
	stackTrace: string | null;
	requestId: string | null;
	requestPath: string | null;
	machineName: string | null;
	threadId: number | null;
	application: string | null;
	environment: string | null;
	userId: string | null;
	userName: string | null;
	sessionId: string | null;
	correlationId: string | null;
	clientIp: string | null;
	userAgent: string | null;
	duration: number | null;
	statusCode: number | null;
	properties: Record<string, unknown> | null;
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
