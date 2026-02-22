/**
 * Log levels for structured logging.
 * MUST match server LogLevelConstants exactly for API compatibility.
 * @see SeventySix.Server/SeventySix.Domains/Logging/Constants/LogLevelConstants.cs
 */
export enum LogLevel
{
	Verbose = 0,
	Debug = 1,
	Information = 2,
	Warning = 3,
	Error = 4,
	Fatal = 5,
	Critical = 6
}

/**
 * Log level string constants matching server API.
 * Use these for string comparisons and API payloads.
 */
export const LOG_LEVEL_STRINGS: Record<keyof typeof LogLevel, string> =
	{
		Verbose: "Verbose",
		Debug: "Debug",
		Information: "Information",
		Warning: "Warning",
		Error: "Error",
		Fatal: "Fatal",
		Critical: "Critical"
	} as const;

/**
 * Valid log levels array for validation.
 */
export const VALID_LOG_LEVELS: readonly string[] =
	Object.values(LOG_LEVEL_STRINGS);