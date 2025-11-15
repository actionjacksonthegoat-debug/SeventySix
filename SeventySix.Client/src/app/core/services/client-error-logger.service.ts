import { Injectable, inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { ErrorQueueService, QueuedError } from "./error-queue.service";
import { LogLevel } from "./logger.service";

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

			const queuedError: QueuedError = {
				logLevel,
				message: errorDetails.message,
				timestamp: new Date(),
				exceptionMessage: error?.message,
				stackTrace: error instanceof Error ? error.stack : undefined,
				sourceContext: this.extractSourceContext(error),
				requestUrl: this.getCurrentUrl(),
				userAgent: navigator.userAgent,
				additionalContext: errorDetails.context
			};

			this.errorQueue.enqueue(queuedError);
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
			const queuedError: QueuedError = {
				logLevel: LogLevel.Error,
				message: errorDetails.message,
				timestamp: new Date(),
				exceptionMessage: errorDetails.httpError.message,
				stackTrace:
					errorDetails.httpError.error instanceof Error
						? errorDetails.httpError.error.stack
						: undefined,
				sourceContext: this.extractSourceContext(
					errorDetails.httpError.error
				),
				requestUrl: errorDetails.httpError.url ?? this.getCurrentUrl(),
				requestMethod: this.extractHttpMethod(errorDetails.httpError),
				statusCode: errorDetails.httpError.status,
				userAgent: navigator.userAgent,
				additionalContext: errorDetails.context
			};

			this.errorQueue.enqueue(queuedError);
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
			const queuedError: QueuedError = {
				logLevel: LogLevel.Error,
				message: errorDetails.message,
				timestamp: new Date(),
				exceptionMessage: errorDetails.error?.message,
				stackTrace: errorDetails.error?.stack,
				sourceContext: this.extractSourceContext(errorDetails.error),
				requestUrl: this.getCurrentUrl(),
				userAgent: navigator.userAgent,
				additionalContext: errorDetails.context
			};

			this.errorQueue.enqueue(queuedError);
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
			const queuedError: QueuedError = {
				logLevel: LogLevel.Warning,
				message,
				timestamp: new Date(),
				requestUrl: this.getCurrentUrl(),
				userAgent: navigator.userAgent,
				additionalContext: context
			};

			this.errorQueue.enqueue(queuedError);
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
			const queuedError: QueuedError = {
				logLevel: LogLevel.Info,
				message,
				timestamp: new Date(),
				requestUrl: this.getCurrentUrl(),
				userAgent: navigator.userAgent,
				additionalContext: context
			};

			this.errorQueue.enqueue(queuedError);
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
	 */
	private extractSourceContext(error?: Error | unknown): string | undefined
	{
		if (!error || !(error instanceof Error) || !error.stack)
		{
			return undefined;
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

		return undefined;
	}

	/**
	 * Extracts HTTP method from HttpErrorResponse.
	 */
	private extractHttpMethod(
		httpError: HttpErrorResponse
	): string | undefined
	{
		// HttpErrorResponse doesn't include method by default
		// Try to extract from error object if available
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (httpError as any).method as string | undefined;
	}

	/**
	 * Gets the current URL.
	 */
	private getCurrentUrl(): string
	{
		return window.location.href;
	}
}
