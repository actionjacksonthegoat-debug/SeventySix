import { DateService } from "@infrastructure/services";

// ============================================================
// Log Level Enumeration
// ============================================================

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

// ============================================================
// Time Constants (avoid magic numbers)
// ============================================================
const MILLISECONDS_PER_MINUTE: number = 60_000;
const MILLISECONDS_PER_HOUR: number = 3_600_000;
const MILLISECONDS_PER_DAY: number = 86_400_000;

// ============================================================
// Log Level Mappings (DRY - single source of truth)
// ============================================================
const LOG_LEVEL_NAMES: Record<LogLevel, string> =
	{
		[LogLevel.Verbose]: "Verbose",
		[LogLevel.Debug]: "Debug",
		[LogLevel.Information]: "Info",
		[LogLevel.Warning]: "Warning",
		[LogLevel.Error]: "Error",
		[LogLevel.Fatal]: "Fatal"
	};

const LOG_LEVEL_CLASSES: Record<LogLevel, string> =
	{
		[LogLevel.Verbose]: "level-verbose",
		[LogLevel.Debug]: "level-debug",
		[LogLevel.Information]: "level-info",
		[LogLevel.Warning]: "level-warning",
		[LogLevel.Error]: "level-error",
		[LogLevel.Fatal]: "level-fatal"
	};

const LOG_LEVEL_ICONS: Record<LogLevel, string> =
	{
		[LogLevel.Verbose]: "bug_report",
		[LogLevel.Debug]: "bug_report",
		[LogLevel.Information]: "lightbulb",
		[LogLevel.Warning]: "warning",
		[LogLevel.Error]: "cancel",
		[LogLevel.Fatal]: "cancel"
	};

// ============================================================
// Log Level Utility Functions
// ============================================================

/**
 * Gets the display name for a log level string
 */
export function getLogLevelName(logLevel: string): string
{
	const level: LogLevel =
		parseLogLevel(logLevel);
	return LOG_LEVEL_NAMES[level];
}

/**
 * Gets the CSS class for a log level string
 */
export function getLogLevelClassName(logLevel: string): string
{
	const level: LogLevel =
		parseLogLevel(logLevel);
	return LOG_LEVEL_CLASSES[level];
}

/**
 * Gets the Material icon name for a log level string
 */
export function getLogLevelIconName(logLevel: string): string
{
	const level: LogLevel =
		parseLogLevel(logLevel);
	return LOG_LEVEL_ICONS[level];
}

// ============================================================
// Time Utility Functions
// ============================================================

/**
 * Converts a date to a human-readable relative time string
 */
export function getRelativeTime(
	date: Date | string,
	dateService: DateService): string
{
	const dateObj: Date =
		typeof date === "string" ? new Date(date) : date;
	const diff: number =
		dateService.nowTimestamp() - dateObj.getTime();

	const days: number =
		Math.floor(diff / MILLISECONDS_PER_DAY);
	if (days > 0)
	{
		return `${days} day${days > 1 ? "s" : ""} ago`;
	}

	const hours: number =
		Math.floor(diff / MILLISECONDS_PER_HOUR);
	if (hours > 0)
	{
		return `${hours} hour${hours > 1 ? "s" : ""} ago`;
	}

	const minutes: number =
		Math.floor(diff / MILLISECONDS_PER_MINUTE);
	if (minutes > 0)
	{
		return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
	}

	return "just now";
}

// ============================================================
// Text Utility Functions
// ============================================================

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string
{
	if (text.length <= maxLength)
	{
		return text;
	}
	return text.substring(0, maxLength) + "...";
}

/**
 * Formats JSON properties string with indentation
 */
export function formatJsonProperties(properties: string | null): string
{
	if (!properties)
	{
		return "";
	}
	try
	{
		const parsed: unknown =
			JSON.parse(properties);
		return JSON.stringify(parsed, null, 2);
	}
	catch
	{
		return properties;
	}
}

// ============================================================
// Stack Trace Utility Functions
// ============================================================

/**
 * Counts stack frames in a .NET stack trace
 */
export function countStackFrames(stackTrace: string | null): number
{
	if (!stackTrace)
	{
		return 0;
	}
	const lines: string[] =
		stackTrace.split("\n");
	return lines
	.filter(
		(line: string): boolean =>
			line
			.trim()
			.startsWith("at "))
	.length;
}

// ============================================================
// Span Utility Functions
// ============================================================

/**
 * Checks if a parent span ID represents a root span (all zeros)
 */
export function isRootSpanId(parentSpanId: string | null): boolean
{
	if (!parentSpanId)
	{
		return false;
	}
	return /^0+$/.test(parentSpanId);
}
