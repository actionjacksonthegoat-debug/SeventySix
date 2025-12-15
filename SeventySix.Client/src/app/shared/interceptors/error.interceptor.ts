/**
 * Error Interceptor
 * Global HTTP error handling interceptor.
 * Converts HTTP errors to application-specific error types.
 * Handles 401 redirects for protected routes.
 */

import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "@environments/environment";
import { AuthService } from "@shared/services/auth.service";
import { LoggerService } from "@shared/services/logger.service";
import { convertToAppError } from "@shared/utilities/http-error.utility";
import { catchError, throwError } from "rxjs";

/**
 * Intercepts HTTP errors and converts them to typed application errors.
 * Follows Single Responsibility Principle (SRP).
 */
export const errorInterceptor: HttpInterceptorFn =
	(req, next) =>
	{
		const logger: LoggerService =
			inject(LoggerService);
		const authService: AuthService =
			inject(AuthService);
		const router: Router =
			inject(Router);

		return next(req)
		.pipe(
			catchError(
				(error: HttpErrorResponse) =>
				{
				// Handle 401 on protected routes - redirect to login
				// Don't check isAuthenticated() because auth may have been cleared
				// by failed token refresh before we get here
					if (error.status === 401 && !req.url.includes("/auth/"))
					{
						logger.warning("Unauthorized access, redirecting to login");
						// Clear any remaining auth state
						if (authService.isAuthenticated())
						{
							authService.logout();
						}
						router.navigate(
							[environment.auth.loginUrl],
							{
								queryParams: { returnUrl: router.url }
							});
					}

					logger.warning("HTTP request failed",
						{
							url: error.url,
							status: error.status,
							method: req.method
						});

					// Convert to application-specific error using centralized utility
					const appError: Error =
						convertToAppError(
							error,
							req.url,
							req.method);

					return throwError(
						() => appError);
				}));
	};
