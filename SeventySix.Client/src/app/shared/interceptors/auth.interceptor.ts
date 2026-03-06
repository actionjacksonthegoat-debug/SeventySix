/**
 * Auth interceptor.
 * Adds JWT authentication token to HTTP requests.
 * Handles automatic token refresh when expired.
 */

import {
	HttpErrorResponse,
	HttpHandlerFn,
	HttpInterceptorFn,
	HttpRequest
} from "@angular/common/http";
import { inject } from "@angular/core";
import { environment } from "@environments/environment";
import {
	AUTH_PUBLIC_PATHS,
	HTTP_BEARER_PREFIX,
	HTTP_HEADER_AUTHORIZATION,
	HTTP_PROTOCOL_PREFIX,
	HTTP_STATIC_ASSET_PREFIX
} from "@shared/constants";
import { AuthService } from "@shared/services/auth.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import { catchError, switchMap, take, throwError, timer } from "rxjs";

export const authInterceptor: HttpInterceptorFn =
	(
		req: HttpRequest<unknown>,
		next: HttpHandlerFn) =>
	{
		const authService: AuthService =
			inject(AuthService);

		// Skip auth header for external URLs (third-party APIs),
		// static asset requests (self-hosted icons), and public auth endpoints
		// Note: change-password requires authentication
		if (
			isExternalUrl(req.url)
				|| isStaticAsset(req.url)
				|| isPublicAuthEndpoint(req.url))
		{
			return next(req);
		}

		const token: string | null =
			authService.getAccessToken();

		// No token - proceed without auth header (guest access)
		if (isNullOrUndefined(token))
		{
			return next(req);
		}

		// Token expired - refresh first
		if (authService.isTokenExpired())
		{
			return authService
				.refreshToken()
				.pipe(
					take(1),
					switchMap(
						(response) =>
						{
						// Refresh returned null — may be transient (5xx/network). Retry once after delay.
							if (isNullOrUndefined(response))
							{
								const retryDelayMs: number = 1000;
								return timer(retryDelayMs)
									.pipe(
										switchMap(
											() =>
												authService
													.refreshToken()
													.pipe(
														take(1),
														switchMap(
															(retryResponse) =>
															{
																if (isNullOrUndefined(retryResponse))
																{
																	return next(req);
																}
																const retryToken: string | null =
																	authService
																		.getAccessToken();
																return next(addAuthHeader(req, retryToken));
															}))));
							}
							const newToken: string | null =
								authService.getAccessToken();
							return next(addAuthHeader(req, newToken));
						}),
					catchError(
						(error: HttpErrorResponse) =>
						{
						// On refresh error, clear auth and let original request fail
							return throwError(
								() => error);
						}));
		}

		return next(addAuthHeader(req, token));
	};

/**
 * Checks if the URL is an external (third-party) URL.
 * Relative URLs and same-origin URLs are internal.
 * Absolute URLs to the configured API origin are also internal.
 * Absolute URLs to different origins are external.
 * @param {string} url
 * The request URL to check.
 * @returns {boolean}
 * True if the URL is external.
 */
function isExternalUrl(url: string): boolean
{
	if (!url.startsWith(HTTP_PROTOCOL_PREFIX))
	{
		return false;
	}

	try
	{
		const requestOrigin: string =
			new URL(url).origin;
		const apiBaseUrl: string =
			environment.apiUrl.startsWith(HTTP_PROTOCOL_PREFIX)
				? environment.apiUrl
				: `${window.location.origin}${environment.apiUrl}`;
		const apiOrigin: string =
			new URL(apiBaseUrl).origin;
		return requestOrigin !== window.location.origin
			&& requestOrigin !== apiOrigin;
	}
	catch
	{
		return false;
	}
}

/**
 * Checks if the URL targets a self-hosted static asset (e.g. icons).
 * These requests don't need auth headers.
 * @param {string} url
 * The request URL to check.
 * @returns {boolean}
 * True if the URL is a static asset path.
 */
function isStaticAsset(url: string): boolean
{
	return url.startsWith(HTTP_STATIC_ASSET_PREFIX);
}

/**
 * Checks if the URL is a public auth endpoint that shouldn't have auth header.
 * change-password is NOT public - it requires authentication.
 * @param {string} url
 * The request URL to check.
 * @returns {boolean}
 * True if the URL is a public auth endpoint.
 */
function isPublicAuthEndpoint(url: string): boolean
{
	return AUTH_PUBLIC_PATHS.some(
		(path: string) => url.includes(path));
}

function addAuthHeader(
	req: HttpRequest<unknown>,
	token: string | null): HttpRequest<unknown>
{
	if (isNullOrUndefined(token))
	{
		return req;
	}

	return req.clone(
		{
			headers: req.headers.set(
				HTTP_HEADER_AUTHORIZATION,
				`${HTTP_BEARER_PREFIX}${token}`)
		});
}