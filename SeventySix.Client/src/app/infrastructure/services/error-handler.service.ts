import { ErrorHandler, Injectable, inject } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";
import { ClientErrorLoggerService } from "./client-error-logger.service";
import { DateService } from "./date.service";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "@infrastructure/models/errors";
import { environment } from "../../../environments/environment";

interface ErrorDetails
{
	message: string;
	details?: string[];
	error?: Error;
	httpError?: HttpErrorResponse;
}

@Injectable({
	providedIn: "root"
})
export class ErrorHandlerService implements ErrorHandler
{
	private readonly logger: LoggerService = inject(LoggerService);
	private readonly notification: NotificationService =
		inject(NotificationService);
	private readonly clientLogger: ClientErrorLoggerService = inject(
		ClientErrorLoggerService
	);
	private readonly dateService: DateService = inject(DateService);

	private isHandlingError: boolean = false;

	handleError(error: Error | HttpErrorResponse): void
	{
		if (this.isHandlingError)
		{
			console.error("[ErrorHandler] Re-entry detected:", error);
			return;
		}

		this.isHandlingError = true;

		try
		{
			const errorDetails: ErrorDetails = this.extractErrorDetails(error);

			this.logToServer(errorDetails);
			this.notifyUser(error, errorDetails);

			if (!environment.production)
			{
				throw error;
			}
		}
		catch (handlingError)
		{
			console.error("[ErrorHandler] Failed:", handlingError);
			console.error("[ErrorHandler] Original:", error);
		}
		finally
		{
			this.isHandlingError = false;
		}
	}

	private logToServer(errorDetails: ErrorDetails): void
	{
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
	}

	private notifyUser(
		error: Error | HttpErrorResponse,
		errorDetails: ErrorDetails
	): void
	{
		const copyData: string = this.buildCopyData(error, errorDetails);
		this.notification.errorWithDetails(
			errorDetails.message,
			errorDetails.details,
			copyData
		);
	}

	private extractErrorDetails(
		error: Error | HttpErrorResponse
	): ErrorDetails
	{
		const details: string[] = [];
		let message: string;

		if (error instanceof HttpErrorResponse)
		{
			message = this.getHttpMessage(error);
			this.extractHttpErrorDetails(error, details, message);
		}
		else
		{
			message = this.getUserMessage(error);
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

	private extractHttpErrorDetails(
		error: HttpErrorResponse,
		details: string[],
		userMessage: string
	): void
	{
		if (error.error?.errors)
		{
			Object.entries(error.error.errors).forEach(
				([field, messages]: [string, unknown]) =>
				{
					if (Array.isArray(messages))
					{
						messages.forEach((msg: string) =>
							details.push(`${field}: ${msg}`)
						);
					}
				}
			);
		}
		else if (error.error?.title && error.error.title !== userMessage)
		{
			details.push(error.error.title);
		}

		if (error.status)
		{
			details.push(`Status: ${error.status} ${error.statusText}`);
		}

		if (error.url)
		{
			details.push(`URL: ${error.url}`);
		}
	}

	private getUserMessage(error: Error): string
	{
		if (error instanceof ValidationError)
		{
			const errorCount: number = Object.keys(error.errors).length;
			const firstError: string | undefined = Object.values(
				error.errors
			)[0]?.[0];
			return errorCount === 1 && firstError
				? firstError
				: `Validation failed: ${errorCount} error(s).`;
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
			return "Network error. Please check your connection.";
		}

		if (error instanceof HttpError)
		{
			return error.message;
		}

		return environment.production
			? "An unexpected error occurred. Please try again."
			: error.message;
	}

	private getHttpMessage(error: HttpErrorResponse): string
	{
		const statusMessages: Record<number, string> = {
			0: "Unable to connect to the server. Check your connection.",
			400:
				error.error?.title ||
				"Invalid request. Please check your input.",
			401: "Your session has expired. Please log in again.",
			403: "You do not have permission to perform this action.",
			404: error.error?.title || "The requested resource was not found.",
			422:
				error.error?.title ||
				"Validation failed. Please check your input.",
			429: "Too many requests. Please try again later.",
			500: "Server error. Please try again later.",
			502: "Server error. Please try again later.",
			503: "Server error. Please try again later.",
			504: "Server error. Please try again later."
		};

		return (
			statusMessages[error.status] ||
			(environment.production
				? "An error occurred."
				: `HTTP ${error.status}: ${error.message}`)
		);
	}

	private buildCopyData(
		error: Error | HttpErrorResponse,
		errorDetails: ErrorDetails
	): string
	{
		const data: Record<string, unknown> = {
			timestamp: this.dateService.now(),
			message: errorDetails.message,
			details: errorDetails.details,
			error: {
				name: error.name,
				message: error.message,
				stack: error instanceof Error ? error.stack : undefined
			}
		};

		if (error instanceof HttpErrorResponse)
		{
			data["request"] = {
				url: error.url,
				status: error.status,
				statusText: error.statusText
			};
			data["response"] = error.error;
		}

		return JSON.stringify(data, null, 2);
	}
}
