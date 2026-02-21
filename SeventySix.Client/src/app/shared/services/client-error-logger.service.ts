import { HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { LogLevel } from "@shared/constants";
import { CreateLogRequest, ErrorDetails } from "@shared/models";
import { DateService } from "@shared/services/date.service";
import { ErrorQueueService } from "@shared/services/error-queue.service";
import {
	extractRequestMethod,
	extractRequestUrl,
	extractStatusCode
} from "@shared/utilities/http-error.utility";
import { logLevelToString } from "@shared/utilities/log-level.utility";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Client-side error logging service with automatic context extraction.
 *
 * **PURPOSE:**
 * Provides a centralized, fail-safe API for logging client-side errors with rich context.
 * Automatically extracts source context from stack traces and enriches logs with
 * HTTP request details, user agent, and timestamps.
 *
 * **USE FOR:**
 * - Logging caught exceptions with `logError()` or `logClientError()`
 * - Logging HTTP failures with `logHttpError()` for full request/response context
 * - Logging warnings with `logWarning()` for non-critical issues
 * - Logging informational messages with `logInfo()` for operational visibility
 *
 * **NOT FOR:**
 * - Console-only logging (use `LoggerService` instead)
 * - Server-side logging (handled by backend Serilog)
 * - Debug logging that should not reach the server
 *
 * **FLOW:**
 * 1. Service receives error/message via `log*()` methods
 * 2. Extracts source context from stack trace (Component.method pattern)
 * 3. Builds `CreateLogRequest` with timestamp, user agent, and context
 * 4. Prepends "[Client]" prefix for server-side filtering
 * 5. Enqueues via `ErrorQueueService` for batched transmission
 * 6. On any failure, falls back to console.error (never throws)
 */
@Injectable(
	{
		providedIn: "root"
	})
export class ClientErrorLoggerService
{
	/**
	 * ErrorQueueService for enqueuing client-side logs to be sent to the server.
	 * @type {ErrorQueueService}
	 * @private
	 * @readonly
	 */
	private readonly errorQueue: ErrorQueueService =
		inject(ErrorQueueService);

	/**
	 * DateService for consistent client timestamps.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Logs a generic error.
	 * @param {ErrorDetails} errorDetails
	 * The error details and optional HTTP error information.
	 * @param {LogLevel} logLevel
	 * The severity level for the log entry (defaults to Error).
	 * @returns {void}
	 */
	logError(
		errorDetails: ErrorDetails,
		logLevel: LogLevel = LogLevel.Error): void
	{
		try
		{
			const error: Error | HttpErrorResponse | undefined =
				errorDetails.error ?? errorDetails.httpError;

			// Prepend [Client] to the message
			const formattedMessage: string =
				`[Client] - ${errorDetails.message}`;

			const logRequest: CreateLogRequest =
				{
					logLevel: logLevelToString(logLevel),
					message: formattedMessage,
					clientTimestamp: this.dateService.now(),
					exceptionMessage: error?.message,
					stackTrace: error instanceof Error ? error.stack : undefined,
					sourceContext: this.extractSourceContext(error),
					requestUrl: extractRequestUrl(error),
					requestMethod: extractRequestMethod(error),
					statusCode: extractStatusCode(error),
					userAgent: navigator.userAgent,
					additionalContext: errorDetails.context
				};

			this.errorQueue.enqueue(logRequest);
		}
		catch (err)
		{
			// Never throw - fallback to console
			console.error(
				"[ClientErrorLoggerService] Failed to log error:",
				err);
			console.error("Original error:", errorDetails);
		}
	}

	/**
	 * Logs an HTTP error with request and response context.
	 * @param {ErrorDetails & { httpError: HttpErrorResponse }} errorDetails
	 * The error details including the `HttpErrorResponse`.
	 * @returns {void}
	 */
	logHttpError(
		errorDetails: ErrorDetails & { httpError: HttpErrorResponse; }): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string =
				`[Client] - ${errorDetails.message}`;

			const logRequest: CreateLogRequest =
				{
					logLevel: logLevelToString(LogLevel.Error),
					message: formattedMessage,
					clientTimestamp: this.dateService.now(),
					exceptionMessage: errorDetails.httpError.message,
					stackTrace: errorDetails.httpError.error instanceof Error
						? errorDetails.httpError.error.stack
						: undefined,
					sourceContext: this.extractSourceContext(
						errorDetails.httpError.error),
					requestUrl: extractRequestUrl(errorDetails.httpError),
					requestMethod: extractRequestMethod(errorDetails.httpError),
					statusCode: extractStatusCode(errorDetails.httpError),
					userAgent: navigator.userAgent,
					additionalContext: errorDetails.context
				};

			this.errorQueue.enqueue(logRequest);
		}
		catch (err)
		{
			console.error(
				"[ClientErrorLoggerService] Failed to log HTTP error:",
				err);
			console.error("Original error:", errorDetails);
		}
	}

	/**
	 * Logs a client-side (non-HTTP) error with contextual information.
	 * @param {ErrorDetails} errorDetails
	 * The error details including any Error instance and context.
	 * @returns {void}
	 */

	logClientError(errorDetails: ErrorDetails): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string =
				`[Client] - ${errorDetails.message}`;

			const logRequest: CreateLogRequest =
				{
					logLevel: logLevelToString(LogLevel.Error),
					message: formattedMessage,
					clientTimestamp: this.dateService.now(),
					exceptionMessage: errorDetails.error?.message,
					stackTrace: errorDetails.error?.stack,
					sourceContext: this.extractSourceContext(errorDetails.error),
					requestUrl: extractRequestUrl(),
					userAgent: navigator.userAgent,
					additionalContext: errorDetails.context
				};

			this.errorQueue.enqueue(logRequest);
		}
		catch (err)
		{
			console.error(
				"[ClientErrorLoggerService] Failed to log client error:",
				err);
			console.error("Original error:", errorDetails);
		}
	}

	/**
	 * Logs a warning message.
	 * @param {string} message
	 * The human-readable warning message.
	 * @param {Record<string, unknown>} context
	 * Optional contextual data to include with the warning.
	 * @returns {void}
	 */
	logWarning(message: string, context?: Record<string, unknown>): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string =
				`[Client] - ${message}`;

			const logRequest: CreateLogRequest =
				{
					logLevel: logLevelToString(LogLevel.Warning),
					message: formattedMessage,
					clientTimestamp: this.dateService.now(),
					requestUrl: extractRequestUrl(),
					userAgent: navigator.userAgent,
					additionalContext: context
				};

			this.errorQueue.enqueue(logRequest);
		}
		catch (err)
		{
			console.error(
				"[ClientErrorLoggerService] Failed to log warning:",
				err);
		}
	}

	/**
	 * Logs an informational message.
	 * @param {string} message
	 * The informational message to log.
	 * @param {Record<string, unknown>} context
	 * Optional contextual data to include with the info log.
	 * @returns {void}
	 */
	logInfo(message: string, context?: Record<string, unknown>): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string =
				`[Client] - ${message}`;

			const logRequest: CreateLogRequest =
				{
					logLevel: logLevelToString(LogLevel.Information),
					message: formattedMessage,
					clientTimestamp: this.dateService.now(),
					requestUrl: extractRequestUrl(),
					userAgent: navigator.userAgent,
					additionalContext: context
				};

			this.errorQueue.enqueue(logRequest);
		}
		catch (err)
		{
			console.error(
				"[ClientErrorLoggerService] Failed to log info:",
				err);
		}
	}

	/**
	 * Extracts source context from an error's stack trace.
	 * @param {Error|unknown} error
	 * The error instance whose stack will be inspected.
	 * @returns {string}
	 * The best-effort source context (e.g., Component.method) or "Client" when none found.
	 */
	private extractSourceContext(error?: Error | unknown): string
	{
		if (isNullOrUndefined(error) || !(error instanceof Error) || isNullOrUndefined(error.stack))
		{
			return "Client";
		}

		// Extract from Angular stack traces
		// Format: "at ComponentName.methodName (file.ts:line:col)"
		const stackLines: string[] =
			error.stack.split("\n");
		for (const line of stackLines)
		{
			// Match Angular component/service patterns
			const match: RegExpMatchArray | null =
				line.match(
					/at\s+(\w+Component|\w+Service)\.(\w+)/);
			if (match)
			{
				return `${match[1]}.${match[2]}`;
			}

			// Fallback: match any class.method pattern
			const fallbackMatch: RegExpMatchArray | null =
				line.match(/at\s+(\w+)\.(\w+)/);
			if (fallbackMatch)
			{
				return `${fallbackMatch[1]}.${fallbackMatch[2]}`;
			}
		}

		// If no specific source found, return "Client"
		return "Client";
	}
}