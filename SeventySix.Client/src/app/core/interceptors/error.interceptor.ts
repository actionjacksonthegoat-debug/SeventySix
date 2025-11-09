/**
 * Error Interceptor
 * Global HTTP error handling interceptor.
 * Converts HTTP errors to application-specific error types.
 */

import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { LoggerService } from "../services/logger.service";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "../models/errors";

/**
 * Intercepts HTTP errors and converts them to typed application errors.
 * Follows Single Responsibility Principle (SRP).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
{
	const logger = inject(LoggerService);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) =>
		{
			logger.warning("HTTP request failed", {
				url: error.url,
				status: error.status,
				method: req.method
			});

			// Convert to application-specific error
			const appError = convertToAppError(error, req.url, req.method);

			return throwError(() => appError);
		})
	);
};

/**
 * Converts HttpErrorResponse to application-specific error.
 */
function convertToAppError(
	error: HttpErrorResponse,
	url: string,
	method: string
): Error
{
	// Network errors (status 0)
	if (error.status === 0)
	{
		return new NetworkError("Unable to connect to the server");
	}

	// Validation errors (400 with validation details)
	if (error.status === 400 && error.error?.errors)
	{
		return new ValidationError("Validation failed", error.error.errors);
	}

	// Not found errors
	if (error.status === 404)
	{
		return new NotFoundError(error.error?.title || "Resource not found");
	}

	// Unauthorized errors
	if (error.status === 401 || error.status === 403)
	{
		return new UnauthorizedError(
			error.error?.title || "Unauthorized access"
		);
	}

	// Generic HTTP errors
	return new HttpError(
		error.error?.title || error.message || "HTTP request failed",
		error.status,
		url,
		method
	);
}
