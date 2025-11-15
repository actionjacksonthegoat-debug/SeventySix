import { Injectable, inject, isDevMode } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { catchError, of } from "rxjs";

/**
 * Log levels for structured logging.
 */
export enum LogLevel
{
	Debug = 0,
	Info = 1,
	Warning = 2,
	Error = 3,
	Critical = 4
}

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

/**
 * Logger service for application-wide logging.
 * Logs to console in development, sends to remote endpoint in production.
 * Follows Single Responsibility Principle (SRP).
 */
@Injectable({
	providedIn: "root"
})
export class LoggerService
{
	private readonly http: HttpClient = inject(HttpClient);
	private readonly isDevMode: boolean = isDevMode();
	private readonly logEndpoint: string = "/api/logs"; // Configure via environment

	/**
	 * Logs debug message (dev only).
	 */
	debug(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Debug, message, context);
	}

	/**
	 * Logs informational message.
	 */
	info(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Info, message, context);
	}

	/**
	 * Logs warning message.
	 */
	warning(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Warning, message, context);
	}

	/**
	 * Logs error message.
	 */
	error(
		message: string,
		error?: Error,
		context?: Record<string, unknown>
	): void
	{
		this.log(LogLevel.Error, message, context, error);
	}

	/**
	 * Logs critical error message.
	 */
	critical(
		message: string,
		error?: Error,
		context?: Record<string, unknown>
	): void
	{
		this.log(LogLevel.Critical, message, context, error);
	}

	/**
	 * Core logging implementation.
	 */
	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void
	{
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			error
		};

		// Always log to console in development
		if (this.isDevMode)
		{
			this.logToConsole(logEntry);
		}

		// Send to remote endpoint in production (errors and above)
		if (!this.isDevMode && level >= LogLevel.Error)
		{
			this.logToRemote(logEntry);
		}
	}

	/**
	 * Logs to browser console.
	 */
	private logToConsole(entry: LogEntry): void
	{
		const prefix: string = `[${LogLevel[entry.level]}] ${entry.timestamp}:`;
		const args: unknown[] = [prefix, entry.message];

		if (entry.context)
		{
			args.push(entry.context);
		}

		if (entry.error)
		{
			args.push(entry.error);
		}

		switch (entry.level)
		{
			case LogLevel.Debug:
			case LogLevel.Info:
				// eslint-disable-next-line no-console
				console.log(...args);
				break;
			case LogLevel.Warning:
				console.warn(...args);
				break;
			case LogLevel.Error:
			case LogLevel.Critical:
				console.error(...args);
				break;
		}
	}

	/**
	 * Sends log entry to remote logging endpoint.
	 */
	private logToRemote(entry: LogEntry): void
	{
		// Serialize error object for JSON
		const payload: Omit<LogEntry, "error"> & {
			error?: { message: string; stack?: string; name: string };
		} = {
			...entry,
			error: entry.error
				? {
						message: entry.error.message,
						stack: entry.error.stack,
						name: entry.error.name
					}
				: undefined
		};

		this.http
			.post(this.logEndpoint, payload)
			.pipe(
				catchError((err) =>
				{
					// Fallback: log to console if remote logging fails
					console.error(
						"Failed to send log to remote endpoint:",
						err
					);
					return of(null);
				})
			)
			.subscribe();
	}
}
