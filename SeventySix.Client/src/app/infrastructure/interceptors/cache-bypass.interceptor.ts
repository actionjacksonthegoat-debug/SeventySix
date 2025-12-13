import {
	HttpContextToken,
	HttpEvent,
	HttpHandlerFn,
	HttpInterceptorFn,
	HttpRequest
} from "@angular/common/http";
import { Observable } from "rxjs";

/**
 * HTTP context token to indicate force refresh request.
 * When set to true, cache-busting headers will be added.
 */
export const FORCE_REFRESH: HttpContextToken<boolean> =
	new HttpContextToken<boolean>(() => false);

/**
 * HTTP interceptor that adds cache-busting headers for force refresh requests.
 *
 * Detects when a request has FORCE_REFRESH context token set to true
 * and adds Cache-Control: no-cache header to bypass server-side OutputCache.
 *
 * Usage: Set context in repository methods called during force refresh.
 */
export const cacheBypassInterceptor: HttpInterceptorFn =
	(
	request: HttpRequest<unknown>,
	next: HttpHandlerFn): Observable<HttpEvent<unknown>> =>
{
	const forceRefresh: boolean =
		request.context.get(FORCE_REFRESH);

	// If force refresh is requested, add cache-busting headers
	if (forceRefresh)
	{
		const modifiedReq: HttpRequest<unknown> =
			request.clone({
			setHeaders: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache"
			}
		});

		return next(modifiedReq);
	}

	return next(request);
};
