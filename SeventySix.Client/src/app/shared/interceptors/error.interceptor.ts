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
import {
	AUTH_PATH_SEGMENT,
	HTTP_BEARER_PREFIX,
	HTTP_HEADER_AUTHORIZATION,
	HTTP_STATUS,
	QUERY_PARAM_VALUES,
	QUERY_PARAMS
} from "@shared/constants";
import { AUTH_ERROR_CODES } from "@shared/constants/error-messages.constants";
import { APP_ROUTES } from "@shared/constants/routes.constants";
import { AuthService } from "@shared/services/auth.service";
import { LoggerService } from "@shared/services/logger.service";
import { convertToAppError } from "@shared/utilities/http-error.utility";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import { catchError, EMPTY, switchMap, take, throwError } from "rxjs";

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
					// Handle 403 PASSWORD_CHANGE_REQUIRED from server filter
						if (
							error.status === HTTP_STATUS.FORBIDDEN
								&& error.error?.error === AUTH_ERROR_CODES.PASSWORD_CHANGE_REQUIRED)
						{
							authService.markPasswordChangeRequired();
							router.navigate(
								[APP_ROUTES.AUTH.CHANGE_PASSWORD],
								{
									queryParams: {
										[QUERY_PARAMS.REQUIRED]: QUERY_PARAM_VALUES.TRUE,
										[QUERY_PARAMS.RETURN_URL]: router.url
									}
								});
							return EMPTY;
						}

						// Handle other 403 responses — navigate to forbidden page
						if (error.status === HTTP_STATUS.FORBIDDEN)
						{
							router.navigate(
								[APP_ROUTES.ERROR.FORBIDDEN]);
							return EMPTY;
						}

						// Handle 401 on protected routes — attempt token refresh + retry before logout
						if (error.status === HTTP_STATUS.UNAUTHORIZED && !req.url.includes(AUTH_PATH_SEGMENT))
						{
							return authService
								.refreshToken()
								.pipe(
									take(1),
									switchMap(
										(response) =>
										{
											if (isNullOrUndefined(response))
											{
											// Refresh failed — force logout and redirect
												logger.warning("Unauthorized access, redirecting to login");
												if (authService.isAuthenticated())
												{
													authService.logout();
												}
												router.navigate(
													[environment.auth.loginUrl],
													{
														queryParams: { [QUERY_PARAMS.RETURN_URL]: router.url }
													});
												return EMPTY;
											}

											// Refresh succeeded — retry the original request with new token
											const newToken: string | null =
												authService.getAccessToken();
											const retryReq: typeof req =
												isNullOrUndefined(newToken)
													? req
													: req.clone(
														{
															headers: req.headers.set(
																HTTP_HEADER_AUTHORIZATION,
																`${HTTP_BEARER_PREFIX}${newToken}`)
														});
											return next(retryReq);
										}));
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