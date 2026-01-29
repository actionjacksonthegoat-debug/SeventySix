import { LOG_LEVEL_STRINGS, LogLevel } from "@shared/constants";
import { NotificationLevel } from "@shared/constants";

/**
 * Maps string log level names to LogLevel enum values.
 * Used for bidirectional conversion between API strings and enum values.
 */
const LOG_LEVEL_MAP: ReadonlyMap<string, LogLevel> =
	new Map(
		[
			["verbose", LogLevel.Verbose],
			["debug", LogLevel.Debug],
			["information", LogLevel.Information],
			["warning", LogLevel.Warning],
			["error", LogLevel.Error],
			["fatal", LogLevel.Fatal],
			["critical", LogLevel.Critical]
		]);

/**
 * Converts LogLevel enum to API-compatible string.
 *
 * @param level
 * The LogLevel enum value to convert.
 *
 * @returns
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
 *
 * @param level
 * The LogLevel enum value to convert.
 *
 * @returns
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
 *
 * @param logLevel
 * The string log level value received from API.
 *
 * @returns
 * The corresponding LogLevel enum value.
 */
export function parseLogLevel(logLevel: string): LogLevel
{
	const normalizedLevel: string =
		logLevel?.toLowerCase() ?? "";
	return LOG_LEVEL_MAP.get(normalizedLevel) ?? LogLevel.Information;
}
