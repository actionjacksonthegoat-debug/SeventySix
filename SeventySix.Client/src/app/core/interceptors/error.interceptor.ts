/**
 * Error Interceptor
 * Global HTTP error handling interceptor.
 * Converts HTTP errors to application-specific error types.
 */

import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { LoggerService } from "@core/services/logger.service";
import { convertToAppError } from "@core/utils/http-error.utilities";

/**
 * Intercepts HTTP errors and converts them to typed application errors.
 * Follows Single Responsibility Principle (SRP).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
{
	const logger: LoggerService = inject(LoggerService);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) =>
		{
			logger.warning("HTTP request failed", {
				url: error.url,
				status: error.status,
				method: req.method
			});

			// Convert to application-specific error using centralized utility
			const appError: Error = convertToAppError(
				error,
				req.url,
				req.method
			);

			return throwError(() => appError);
		})
	);
};
