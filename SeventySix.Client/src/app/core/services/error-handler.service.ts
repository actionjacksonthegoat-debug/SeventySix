import { ErrorHandler, Injectable, inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";
import { ClientErrorLoggerService } from "./client-error-logger.service";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "../models/errors";

interface ErrorDetails
{
	message: string;
	details?: string[];
	error?: Error;
	httpError?: HttpErrorResponse;
}

/**
 * Global error handler service.
 * Catches all unhandled errors and provides user-friendly messages.
 * Follows Single Responsibility Principle (SRP) and Dependency Inversion Principle (DIP).
 */
@Injectable({
	providedIn: "root"
})
export class ErrorHandlerService implements ErrorHandler
{
	private readonly logger = inject(LoggerService);
	private readonly notification = inject(NotificationService);
	private readonly clientLogger = inject(ClientErrorLoggerService);

	// Guard flag to prevent re-entry during error handling
	private isHandlingError = false;

	/**
	 * Handles errors globally.
	 */
	handleError(error: Error | HttpErrorResponse): void
	{
		// Prevent re-entry if we're already handling an error
		if (this.isHandlingError)
		{
			console.error(
				"[ErrorHandler] Re-entry detected, logging to console only:",
				error
			);
			return;
		}

		this.isHandlingError = true;

		try
		{
			// Extract error details
			const errorDetails = this.extractErrorDetails(error);

			// Log to server via queue
			if (errorDetails.httpError)
			{
				this.clientLogger.logHttpError({
					message: errorDetails.message,
					httpError: errorDetails.httpError
				});
			}
			else if (errorDetails.error)
			{
				this.clientLogger.logError({
					message: errorDetails.message,
					error: errorDetails.error
				});
			}

			// Show user notification
			this.showUserNotification(errorDetails, error);

			// Re-throw in development for debugging
			if (this.isDevelopment())
			{
				throw error;
			}
		}
		catch (loggingError)
		{
			// If logging itself fails, just console log and continue
			console.error("[ErrorHandler] Logging failed:", loggingError);
			console.error("[ErrorHandler] Original error:", error);
		}
		finally
		{
			this.isHandlingError = false;
		}
	}

	/**
	 * Converts error to user-friendly message.
	 */
	private getUserMessage(error: Error | HttpErrorResponse): string
	{
		// HTTP errors
		if (error instanceof HttpErrorResponse)
		{
			return this.getHttpErrorMessage(error);
		}

		// Custom application errors
		if (error instanceof ValidationError)
		{
			return this.getValidationErrorMessage(error);
		}

		if (error instanceof NotFoundError)
		{
			return error.message || "The requested resource was not found.";
		}

		if (error instanceof UnauthorizedError)
		{
			return (
				error.message ||
				"You are not authorized to perform this action."
			);
		}

		if (error instanceof NetworkError)
		{
			return "Network error. Please check your internet connection.";
		}

		if (error instanceof HttpError)
		{
			return error.message;
		}

		// Generic errors
		return this.isDevelopment()
			? error.message
			: "An unexpected error occurred. Please try again later.";
	}

	/**
	 * Gets user message for HTTP errors.
	 */
	private getHttpErrorMessage(error: HttpErrorResponse): string
	{
		switch (error.status)
		{
			case 0:
				return "Unable to connect to the server. Please check your internet connection.";
			case 400:
				return (
					error.error?.title ||
					"Invalid request. Please check your input."
				);
			case 401:
				return "Your session has expired. Please log in again.";
			case 403:
				return "You do not have permission to perform this action.";
			case 404:
				return (
					error.error?.title ||
					"The requested resource was not found."
				);
			case 422:
				return (
					error.error?.title ||
					"Validation failed. Please check your input."
				);
			case 429:
				return "Too many requests. Please try again later.";
			case 500:
			case 502:
			case 503:
			case 504:
				return "Server error. Please try again later.";
			default:
				return this.isDevelopment()
					? `HTTP ${error.status}: ${error.message}`
					: "An error occurred. Please try again later.";
		}
	}

	/**
	 * Gets user message for validation errors.
	 */
	private getValidationErrorMessage(error: ValidationError): string
	{
		const errorCount = Object.keys(error.errors).length;
		const firstError = Object.values(error.errors)[0]?.[0];

		if (errorCount === 1 && firstError)
		{
			return firstError;
		}

		return `Validation failed: ${errorCount} ${errorCount === 1 ? "error" : "errors"} found.`;
	}

	/**
	 * Checks if running in development mode.
	 */
	private isDevelopment(): boolean
	{
		return !("production" === "production"); // Will be replaced by build process
	}

	/**
	 * Extracts structured error details from any error type.
	 */
	private extractErrorDetails(
		error: Error | HttpErrorResponse
	): ErrorDetails
	{
		let message: string;
		const details: string[] = [];

		if (error instanceof HttpErrorResponse)
		{
			message = this.getHttpErrorMessage(error);
			this.extractHttpErrorDetails(error, details);
		}
		else
		{
			message = this.getUserMessage(error);
			// Add technical message if different from user message
			if (error.message && error.message !== message)
			{
				details.push(`Technical: ${error.message}`);
			}
		}

		return {
			message,
			details: details.length > 0 ? details : undefined,
			error: error instanceof Error ? error : undefined,
			httpError: error instanceof HttpErrorResponse ? error : undefined
		};
	}

	/**
	 * Extracts detailed error information from HTTP errors.
	 */
	private extractHttpErrorDetails(
		error: HttpErrorResponse,
		details: string[]
	): void
	{
		// Extract validation errors
		if (error.error?.errors)
		{
			Object.entries(error.error.errors).forEach(([field, messages]) =>
			{
				if (Array.isArray(messages))
				{
					messages.forEach((msg) => details.push(`${field}: ${msg}`));
				}
			});
		}
		else if (
			error.error?.title &&
			error.error.title !== this.getHttpErrorMessage(error)
		)
		{
			details.push(error.error.title);
		}

		// Add status information
		if (error.status)
		{
			details.push(`Status: ${error.status} ${error.statusText}`);
		}

		// Add URL
		if (error.url)
		{
			details.push(`URL: ${error.url}`);
		}
	}

	/**
	 * Shows user notification with error safety.
	 */
	private showUserNotification(
		errorDetails: ErrorDetails,
		error: Error | HttpErrorResponse
	): void
	{
		try
		{
			const copyData = this.generateCopyData(error, errorDetails);

			if (errorDetails.details && errorDetails.details.length > 0)
			{
				this.notification.errorWithDetails(
					errorDetails.message,
					errorDetails.details,
					copyData
				);
			}
			else
			{
				this.notification.errorWithDetails(
					errorDetails.message,
					undefined,
					copyData
				);
			}
		}
		catch (notificationError)
		{
			// If notification fails, just log to console
			console.error(
				"[ErrorHandler] Notification failed:",
				notificationError
			);
		}
	}

	/**
	 * Generates JSON copy data for clipboard.
	 */
	private generateCopyData(
		error: Error | HttpErrorResponse,
		details: ErrorDetails
	): string
	{
		const copyObject: Record<string, unknown> = {
			timestamp: new Date().toISOString(),
			message: details.message,
			details: details.details,
			error: {
				name: error.name,
				message: error.message,
				stack: error instanceof Error ? error.stack : undefined
			}
		};

		if (error instanceof HttpErrorResponse)
		{
			copyObject["request"] = {
				url: error.url,
				status: error.status,
				statusText: error.statusText
			};
			copyObject["response"] = error.error;
		}

		return JSON.stringify(copyObject, null, 2);
	}
}
