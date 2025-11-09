import { ErrorHandler, Injectable, inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "../models/errors";

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

	/**
	 * Handles errors globally.
	 */
	handleError(error: Error | HttpErrorResponse): void
	{
		// Log all errors
		this.logger.error("Unhandled error occurred", error, {
			type: error.constructor.name,
			url: error instanceof HttpErrorResponse ? error.url : undefined
		});

		// Display user-friendly message
		const userMessage = this.getUserMessage(error);
		this.notification.error(userMessage);

		// Re-throw in development for debugging
		if (this.isDevelopment())
		{
			throw error;
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
}
