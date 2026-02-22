import { LogLevel } from "@shared/constants";

/**
 * Log entry structure for remote logging.
 */
export interface LogEntry
{
	/**
	 * ISO 8601 timestamp when the log entry was created.
	 * @type {string}
	 */
	timestamp: string;

	/**
	 * Severity level of the log entry.
	 * @type {LogLevel}
	 */
	level: LogLevel;

	/**
	 * Human-readable log message.
	 * @type {string}
	 */
	message: string;

	/**
	 * Optional structured context for additional data.
	 * @type {Record<string, unknown> | undefined}
	 */
	context?: Record<string, unknown>;

	/**
	 * Optional Error instance associated with this log entry.
	 * @type {Error | undefined}
	 */
	error?: Error;
}