/**
 * Auth interceptor.
 * Adds JWT authentication token to HTTP requests.
 * Handles automatic token refresh when expired.
 */

import {
	HttpInterceptorFn,
	HttpRequest,
	HttpHandlerFn,
	HttpErrorResponse
} from "@angular/common/http";
import { inject } from "@angular/core";
import { switchMap, take, catchError, throwError } from "rxjs";
import { AuthService } from "@infrastructure/services/auth.service";
import {
	HTTP_HEADER_AUTHORIZATION,
	HTTP_BEARER_PREFIX
} from "@infrastructure/constants";

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<unknown>,
	next: HttpHandlerFn
) =>
{
	const authService: AuthService = inject(AuthService);

	// Skip auth header for public auth endpoints (login, refresh, logout, OAuth)
	// Note: change-password requires authentication
	if (isPublicAuthEndpoint(req.url))
	{
		return next(req);
	}

	const token: string | null = authService.getAccessToken();

	// No token - proceed without auth header (guest access)
	if (!token)
	{
		return next(req);
	}

	// Token expired - refresh first
	if (authService.isTokenExpired())
	{
		return authService.refreshToken().pipe(
			take(1),
			switchMap((response) =>
			{
				// If refresh failed (returned null), let the request proceed without token
				// The server will return 401 which triggers login redirect
				if (!response)
				{
					return next(req);
				}
				const newToken: string | null = authService.getAccessToken();
				return next(addAuthHeader(req, newToken));
			}),
			catchError((error: HttpErrorResponse) =>
			{
				// On refresh error, clear auth and let original request fail
				return throwError(() => error);
			})
		);
	}

	return next(addAuthHeader(req, token));
};

/**
 * Checks if the URL is a public auth endpoint that shouldn't have auth header.
 * change-password is NOT public - it requires authentication.
 */
function isPublicAuthEndpoint(url: string): boolean
{
	const publicAuthPaths: string[] = [
		"/auth/login",
		"/auth/refresh",
		"/auth/logout",
		"/auth/github",
		"/auth/callback"
	];

	return publicAuthPaths.some((path: string) => url.includes(path));
}

function addAuthHeader(
	req: HttpRequest<unknown>,
	token: string | null
): HttpRequest<unknown>
{
	if (!token)
	{
		return req;
	}

	return req.clone({
		headers: req.headers.set(
			HTTP_HEADER_AUTHORIZATION,
			`${HTTP_BEARER_PREFIX}${token}`
		)
	});
}
