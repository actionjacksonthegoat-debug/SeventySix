import { HttpClient } from "@angular/common/http";
import { inject, Injectable, isDevMode } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@environments/environment";
import { LogLevel } from "@shared/constants";
import { CreateLogRequest, LogEntry } from "@shared/models";
import { DateService } from "@shared/services/date.service";
import { logLevelToString } from "@shared/utilities";
import { catchError, of } from "rxjs";

/**
 * Console log level configuration type.
 */
type ConsoleLogLevel = "debug" | "info" | "warn" | "error" | "none";

/**
 * Logger service for application-wide logging.
 * Logs to console based on configured log level, sends to remote endpoint in production.
 * Follows Single Responsibility Principle (SRP).
 */
@Injectable(
	{
		providedIn: "root"
	})
export class LoggerService
{
	/**
	 * HTTP client for sending remote logs.
	 * @type {HttpClient}
	 * @private
	 * @readonly
	 */
	private readonly http: HttpClient =
		inject(HttpClient);

	/**
	 * Router for retrieving the current route URL.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * DateService for consistent timestamp formatting.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Whether the app is running in dev mode.
	 * @type {boolean}
	 * @private
	 * @readonly
	 */
	private readonly isDevMode: boolean =
		isDevMode();

	/**
	 * Remote logging endpoint URL.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly logEndpoint: string =
		`${environment.apiUrl}/logs/client`;

	/**
	 * Console log level from configuration.
	 * @type {ConsoleLogLevel}
	 * @private
	 * @readonly
	 */
	private readonly consoleLogLevel: ConsoleLogLevel =
		environment.logging.consoleLogLevel;

	/**
	 * Maps console log level config to minimum LogLevel enum.
	 * @type {LogLevel}
	 * @private
	 * @readonly
	 */
	private readonly minLogLevel: LogLevel =
		this.getMinLogLevel();

	/**
	 * Determines the minimum LogLevel based on configured console log level.
	 * @returns {LogLevel}
	 * The minimum LogLevel value to allow console logging.
	 */
	private getMinLogLevel(): LogLevel
	{
		switch (this.consoleLogLevel)
		{
			case "debug":
				return LogLevel.Debug;
			case "info":
				return LogLevel.Information;
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
	 * Logs a debug message (development only).
	 * @param {string} message
	 * The message to log.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	debug(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Debug, message, context);
	}

	/**
	 * Logs an informational message.
	 * @param {string} message
	 * The message to log.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	info(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Information, message, context);
	}

	/**
	 * Logs a warning message.
	 * @param {string} message
	 * The message to log.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	warning(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Warning, message, context);
	}

	/**
	 * Logs an error message with optional Error object.
	 * @param {string} message
	 * The message to log.
	 * @param {Error} error
	 * Optional Error instance to include stack/exception details.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	error(
		message: string,
		error?: Error,
		context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Error, message, context, error);
	}

	/**
	 * Logs a critical error message with optional Error instance.
	 * @param {string} message
	 * The message to log.
	 * @param {Error} error
	 * Optional Error instance to include stack/exception details.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	critical(
		message: string,
		error?: Error,
		context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Critical, message, context, error);
	}

	/**
	 * Force logs a debug message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 * @param {string} message
	 * The message to log.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	forceDebug(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Debug, message, context, undefined, true);
	}

	/**
	 * Force logs info message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 * @param {string} message
	 * The message to log.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	forceInfo(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Information, message, context, undefined, true);
	}

	/**
	 * Force logs warning message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 * @param {string} message
	 * The message to log.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	forceWarning(message: string, context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Warning, message, context, undefined, true);
	}

	/**
	 * Force logs error message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 * @param {string} message
	 * The message to log.
	 * @param {Error} error
	 * Optional Error instance to include stack/exception details.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	forceError(
		message: string,
		error?: Error,
		context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Error, message, context, error, true);
	}

	/**
	 * Force logs critical message, bypassing level filtering.
	 * Always logs to console and sends to remote.
	 * @param {string} message
	 * The message to log.
	 * @param {Error} error
	 * Optional Error instance to include stack/exception details.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @returns {void}
	 */
	forceCritical(
		message: string,
		error?: Error,
		context?: Record<string, unknown>): void
	{
		this.log(LogLevel.Critical, message, context, error, true);
	}

	/**
	 * Core logging implementation responsible for console and remote logging based on level.
	 * @param {LogLevel} level
	 * The log level for this entry.
	 * @param {string} message
	 * The message to be logged.
	 * @param {Record<string, unknown>} context
	 * Optional structured context to include with the log entry.
	 * @param {Error} error
	 * Optional Error instance to include stack/exception details.
	 * @param {boolean} force
	 * When true, bypasses all level filtering (console and remote).
	 * @returns {void}
	 */
	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error,
		force: boolean = false): void
	{
		const logEntry: LogEntry =
			{
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
	 * @param {LogEntry} entry
	 * The log entry payload to write to the console.
	 * @returns {void}
	 */
	private logToConsole(entry: LogEntry): void
	{
		const prefix: string =
			`[${logLevelToString(entry.level)}] ${entry.timestamp}:`;
		const args: unknown[] =
			[prefix, entry.message];

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
			case LogLevel.Verbose:
			case LogLevel.Debug:
			case LogLevel.Information:
				// eslint-disable-next-line no-console
				console.log(...args);
				break;
			case LogLevel.Warning:
				console.warn(...args);
				break;
			case LogLevel.Error:
			case LogLevel.Fatal:
			case LogLevel.Critical:
				console.error(...args);
				break;
		}
	}

	/**
	 * Sends a log entry to the remote logging endpoint.
	 * @param {LogEntry} entry
	 * The log entry payload to send to the server.
	 * @returns {void}
	 */
	private logToRemote(entry: LogEntry): void
	{
		// Convert LogLevel enum to string using utility
		const logLevelString: string =
			logLevelToString(entry.level);

		// Get current route URL
		const currentUrl: string =
			this.router.url || window.location.pathname;

		// Prepare client log request matching backend DTO
		const payload: CreateLogRequest =
			{
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

		this
			.http
			.post(this.logEndpoint, payload)
			.pipe(
				catchError(
					(err) =>
					{
						// Fallback: log to console if remote logging fails
						console.error(
							"Failed to send log to remote endpoint:",
							err);
						return of(null);
					}))
			.subscribe();
	}
}
