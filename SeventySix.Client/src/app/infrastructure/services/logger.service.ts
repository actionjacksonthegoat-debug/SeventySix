import { Injectable, inject, isDevMode } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, of } from "rxjs";
import { environment } from "@environments/environment";
import { CreateLogRequest } from "@infrastructure/models";
import { DateService } from "./date.service";

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
 * Console log level configuration type.
 */
type ConsoleLogLevel = "debug" | "info" | "warn" | "error" | "none";

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
 * Logs to console based on configured log level, sends to remote endpoint in production.
 * Follows Single Responsibility Principle (SRP).
 */
@Injectable({
	providedIn: "root"
})
export class LoggerService
{
	private readonly http: HttpClient = inject(HttpClient);
	private readonly router: Router = inject(Router);
	private readonly dateService: DateService = inject(DateService);
	private readonly isDevMode: boolean = isDevMode();
	private readonly logEndpoint: string = `${environment.apiUrl}/logs/client`;
	private readonly consoleLogLevel: ConsoleLogLevel =
		environment.logging.consoleLogLevel;

	/**
	 * Maps console log level config to minimum LogLevel enum.
	 */
	private readonly minLogLevel: LogLevel = this.getMinLogLevel();

	private getMinLogLevel(): LogLevel
	{
		switch (this.consoleLogLevel)
		{
			case "debug":
				return LogLevel.Debug;
			case "info":
				return LogLevel.Info;
			case "warn":
				return LogLevel.Warning;
			case "error":
				return LogLevel.Error;
			case "none":
				return LogLevel.Critical + 1; // Higher than any level
			default:
				return LogLevel.Warning;
		}
	}

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
	 * Force logs debug message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 */
	forceDebug(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Debug, message, context, undefined, true);
	}

	/**
	 * Force logs info message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 */
	forceInfo(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Info, message, context, undefined, true);
	}

	/**
	 * Force logs warning message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 */
	forceWarning(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Warning, message, context, undefined, true);
	}

	/**
	 * Force logs error message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 */
	forceError(
		message: string,
		error?: Error,
		context?: Record<string, unknown>
	): void
	{
		this.log(LogLevel.Error, message, context, error, true);
	}

	/**
	 * Force logs critical message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 */
	forceCritical(
		message: string,
		error?: Error,
		context?: Record<string, unknown>
	): void
	{
		this.log(LogLevel.Critical, message, context, error, true);
	}

	/**
	 * Core logging implementation.
	 * @param force - When true, bypasses all level filtering (console and remote).
	 */
	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error,
		force: boolean = false
	): void
	{
		const logEntry: LogEntry = {
			timestamp: this.dateService.now(),
			level,
			message,
			context,
			error
		};

		// Log to console if level meets minimum threshold or force is true
		if (force || level >= this.minLogLevel)
		{
			this.logToConsole(logEntry);
		}

		// Send to remote endpoint in production (errors and above) or when forced
		if (force || (!this.isDevMode && level >= LogLevel.Error))
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
		// Convert LogLevel enum to string
		const logLevelString: string = LogLevel[entry.level];

		// Get current route URL
		const currentUrl: string = this.router.url || window.location.pathname;

		// Prepare client log request matching backend DTO
		const payload: CreateLogRequest = {
			logLevel: logLevelString,
			message: entry.message,
			exceptionMessage: entry.error?.message,
			stackTrace: entry.error?.stack,
			sourceContext: "Client", // Set source as "Client" for all client-side logs
			requestUrl: currentUrl,
			userAgent: navigator.userAgent,
			clientTimestamp: entry.timestamp,
			additionalContext: entry.context
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
