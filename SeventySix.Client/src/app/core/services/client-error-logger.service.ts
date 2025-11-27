import { Injectable, inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { ErrorQueueService } from "./error-queue.service";
import { LogLevel } from "./logger.service";
import { DateService } from "./date.service";
import { ClientLogRequest } from "@core/models/client-log-request.model";
import {
	extractRequestUrl,
	extractRequestMethod,
	extractStatusCode
} from "@core/utils/http-error.utilities";

/**
 * Error details for logging.
 */
export interface ErrorDetails
{
	message: string;
	error?: Error;
	httpError?: HttpErrorResponse;
	context?: Record<string, unknown>;
}

/**
 * Client error logger service.
 * Centralizes client-side error logging with automatic context extraction.
 * Never throws errors - always falls back to console logging.
 */
@Injectable({
	providedIn: "root"
})
export class ClientErrorLoggerService
{
	private readonly errorQueue: ErrorQueueService = inject(ErrorQueueService);
	private readonly dateService: DateService = inject(DateService);

	/**
	 * Logs a generic error.
	 */
	logError(
		errorDetails: ErrorDetails,
		logLevel: LogLevel = LogLevel.Error
	): void
	{
		try
		{
			const error: Error | HttpErrorResponse | undefined =
				errorDetails.error ?? errorDetails.httpError;

			// Prepend [Client] to the message
			const formattedMessage: string = `[Client] - ${errorDetails.message}`;

			const logRequest: ClientLogRequest = {
				logLevel: LogLevel[logLevel],
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
				err
			);
			console.error("Original error:", errorDetails);
		}
	} /**
	 * Logs an HTTP error.
	 */
	logHttpError(
		errorDetails: ErrorDetails & { httpError: HttpErrorResponse }
	): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string = `[Client] - ${errorDetails.message}`;

			const logRequest: ClientLogRequest = {
				logLevel: LogLevel[LogLevel.Error],
				message: formattedMessage,
				clientTimestamp: this.dateService.now(),
				exceptionMessage: errorDetails.httpError.message,
				stackTrace:
					errorDetails.httpError.error instanceof Error
						? errorDetails.httpError.error.stack
						: undefined,
				sourceContext: this.extractSourceContext(
					errorDetails.httpError.error
				),
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
				err
			);
			console.error("Original error:", errorDetails);
		}
	} /**
	 * Logs a client-side error (not HTTP related).
	 */
	logClientError(errorDetails: ErrorDetails): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string = `[Client] - ${errorDetails.message}`;

			const logRequest: ClientLogRequest = {
				logLevel: LogLevel[LogLevel.Error],
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
				err
			);
			console.error("Original error:", errorDetails);
		}
	}

	/**
	 * Logs a warning message.
	 */
	logWarning(message: string, context?: Record<string, unknown>): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string = `[Client] - ${message}`;

			const logRequest: ClientLogRequest = {
				logLevel: LogLevel[LogLevel.Warning],
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
				err
			);
		}
	}

	/**
	 * Logs an info message.
	 */
	logInfo(message: string, context?: Record<string, unknown>): void
	{
		try
		{
			// Prepend [Client] to the message
			const formattedMessage: string = `[Client] - ${message}`;

			const logRequest: ClientLogRequest = {
				logLevel: LogLevel[LogLevel.Info],
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
				err
			);
		}
	}

	/**
	 * Extracts source context from error stack trace.
	 * Looks for component or service names.
	 * Falls back to "Client" if no specific source is found.
	 */
	private extractSourceContext(error?: Error | unknown): string
	{
		if (!error || !(error instanceof Error) || !error.stack)
		{
			return "Client";
		}

		// Extract from Angular stack traces
		// Format: "at ComponentName.methodName (file.ts:line:col)"
		const stackLines: string[] = error.stack.split("\n");
		for (const line of stackLines)
		{
			// Match Angular component/service patterns
			const match: RegExpMatchArray | null = line.match(
				/at\s+(\w+Component|\w+Service)\.(\w+)/
			);
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
