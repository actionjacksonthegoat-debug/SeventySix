import { LogLevel } from "@shared/constants";

/**
 * Log entry structure for remote logging.
 */
export interface LogEntry
{
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, unknown>;
	error?: Error;
}
