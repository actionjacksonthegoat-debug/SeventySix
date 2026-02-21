import { LogLevel } from "@shared/constants";
import { parseLogLevel } from "@shared/utilities";
import { isNullOrEmpty } from "@shared/utilities/null-check.utility";

// Re-export for consumers
export { LogLevel, parseLogLevel };

// ============================================================
// Log Level Mappings
// ============================================================
const LOG_LEVEL_NAMES: Record<LogLevel, string> =
	{
		[LogLevel.Verbose]: "Verbose",
		[LogLevel.Debug]: "Debug",
		[LogLevel.Information]: "Information",
		[LogLevel.Warning]: "Warning",
		[LogLevel.Error]: "Error",
		[LogLevel.Fatal]: "Fatal",
		[LogLevel.Critical]: "Critical"
	};

const LOG_LEVEL_CLASSES: Record<LogLevel, string> =
	{
		[LogLevel.Verbose]: "level-verbose",
		[LogLevel.Debug]: "level-debug",
		[LogLevel.Information]: "level-info",
		[LogLevel.Warning]: "level-warning",
		[LogLevel.Error]: "level-error",
		[LogLevel.Fatal]: "level-fatal",
		[LogLevel.Critical]: "level-critical"
	};

const LOG_LEVEL_ICONS: Record<LogLevel, string> =
	{
		[LogLevel.Verbose]: "bug_report",
		[LogLevel.Debug]: "bug_report",
		[LogLevel.Information]: "lightbulb",
		[LogLevel.Warning]: "warning",
		[LogLevel.Error]: "cancel",
		[LogLevel.Fatal]: "cancel",
		[LogLevel.Critical]: "cancel"
	};

// ============================================================
// Log Level Utility Functions
// ============================================================

/**
 * Gets the display name for a log level string.
 * @param {string} logLevel
 * The string representation of the log level (e.g., 'info', 'error').
 * @returns {string}
 * The display name corresponding to the provided log level.
 */
export function getLogLevelName(logLevel: string): string
{
	const level: LogLevel =
		parseLogLevel(logLevel);
	return LOG_LEVEL_NAMES[level];
}

/**
 * Gets the CSS class for a log level string.
 * @param {string} logLevel
 * The string representation of the log level (e.g., 'info', 'error').
 * @returns {string}
 * The CSS class name used for styling log entries for the given log level.
 */
export function getLogLevelClassName(logLevel: string): string
{
	const level: LogLevel =
		parseLogLevel(logLevel);
	return LOG_LEVEL_CLASSES[level];
}

/**
 * Gets the Material icon name for a log level string.
 * @param {string} logLevel
 * The string representation of the log level (e.g., 'info', 'error').
 * @returns {string}
 * The Material icon name representing the provided log level.
 */
export function getLogLevelIconName(logLevel: string): string
{
	const level: LogLevel =
		parseLogLevel(logLevel);
	return LOG_LEVEL_ICONS[level];
}

// ============================================================
// Text Utility Functions
// ============================================================

/**
 * Truncates text to a maximum length with ellipsis.
 * @param {string} text
 * The text to truncate.
 * @param {number} maxLength
 * The maximum allowed length for the returned string.
 * @returns {string}
 * The truncated string with an ellipsis appended if it exceeded maxLength.
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
 * Formats JSON properties string with indentation.
 * @param {string | null} properties
 * A JSON string containing properties to format.
 * @returns {string}
 * A pretty-printed JSON string or an empty string when input is falsy or invalid JSON.
 */
export function formatJsonProperties(properties: string | null): string
{
	if (isNullOrEmpty(properties))
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
 * Counts stack frames in a .NET stack trace.
 * @param {string | null} stackTrace
 * The stack trace string to analyze (may be null).
 * @returns {number}
 * The number of stack frames found in the provided stack trace.
 */
export function countStackFrames(stackTrace: string | null): number
{
	if (isNullOrEmpty(stackTrace))
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
 * Checks if a parent span ID represents a root span (all zeros).
 * @param {string | null} parentSpanId
 * The parent span identifier to inspect.
 * @returns {boolean}
 * True when the provided span ID consists solely of zeros, false otherwise.
 */
export function isRootSpanId(parentSpanId: string | null): boolean
{
	if (isNullOrEmpty(parentSpanId))
	{
		return false;
	}
	return /^0+$/.test(parentSpanId);
}