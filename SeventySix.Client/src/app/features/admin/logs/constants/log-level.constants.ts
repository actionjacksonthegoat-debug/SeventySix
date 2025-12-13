// <copyright file="log-level.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Log level constants matching server Serilog levels.
 */

/** Verbose log level (most detailed). */
export const LOG_LEVEL_VERBOSE: string = "Verbose";

/** Debug log level. */
export const LOG_LEVEL_DEBUG: string = "Debug";

/** Information log level. */
export const LOG_LEVEL_INFORMATION: string = "Information";

/** Warning log level. */
export const LOG_LEVEL_WARNING: string = "Warning";

/** Error log level. */
export const LOG_LEVEL_ERROR: string = "Error";

/** Fatal log level. */
export const LOG_LEVEL_FATAL: string = "Fatal";

/** Critical log level (alias for Fatal). */
export const LOG_LEVEL_CRITICAL: string = "Critical";

/** Valid log levels for filtering. */
export const VALID_LOG_LEVELS: readonly string[] =
	[
	LOG_LEVEL_VERBOSE,
	LOG_LEVEL_DEBUG,
	LOG_LEVEL_INFORMATION,
	LOG_LEVEL_WARNING,
	LOG_LEVEL_ERROR,
	LOG_LEVEL_FATAL
] as const;
