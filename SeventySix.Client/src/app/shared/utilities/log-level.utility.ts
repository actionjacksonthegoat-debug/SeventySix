import { LogLevel, LOG_LEVEL_STRINGS } from "@shared/constants";
import { NotificationLevel } from "@shared/constants";

/**
 * Converts LogLevel enum to API-compatible string.
 * @param {LogLevel} level
 * The LogLevel enum value to convert.
 * @returns {string}
 * String matching server LogLevelConstants.
 */
export function logLevelToString(level: LogLevel): string
{
	const mapping: Record<LogLevel, string> =
		{
			[LogLevel.Verbose]: LOG_LEVEL_STRINGS.Verbose,
			[LogLevel.Debug]: LOG_LEVEL_STRINGS.Debug,
			[LogLevel.Information]: LOG_LEVEL_STRINGS.Information,
			[LogLevel.Warning]: LOG_LEVEL_STRINGS.Warning,
			[LogLevel.Error]: LOG_LEVEL_STRINGS.Error,
			[LogLevel.Fatal]: LOG_LEVEL_STRINGS.Fatal,
			[LogLevel.Critical]: LOG_LEVEL_STRINGS.Critical
		};
	return mapping[level];
}

/**
 * Converts LogLevel to NotificationLevel for UI display.
 * Rule: Error, Fatal, Critical → NotificationLevel.Error
 * @param {LogLevel} level
 * The LogLevel enum value to convert.
 * @returns {NotificationLevel}
 * Appropriate NotificationLevel for UI display.
 */
export function logLevelToNotificationLevel(level: LogLevel): NotificationLevel
{
	if (level >= LogLevel.Error)
	{
		return NotificationLevel.Error;
	}
	if (level === LogLevel.Warning)
	{
		return NotificationLevel.Warning;
	}
	return NotificationLevel.Info;
}

/**
 * Parses string log level from API to LogLevel enum.
 * Handles case-insensitive matching.
 * @param {string} logLevel
 * The string log level value received from API.
 * @returns {LogLevel}
 * The corresponding LogLevel enum value.
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
			return LogLevel.Information;
		case "warning":
			return LogLevel.Warning;
		case "error":
			return LogLevel.Error;
		case "fatal":
			return LogLevel.Fatal;
		case "critical":
			return LogLevel.Critical;
		default:
			return LogLevel.Information;
	}
}
