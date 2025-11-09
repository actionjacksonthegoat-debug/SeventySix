/**
 * Logging Interceptor
 * Logs HTTP requests and responses for debugging
 */

import { HttpInterceptorFn } from "@angular/common/http";
import { tap, finalize } from "rxjs";

/**
 * Intercepts HTTP requests/responses for logging
 * Only logs in development mode
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) =>
{
	const startTime = Date.now();
	const isDevelopment = true; // TODO: Get from environment

	if (!isDevelopment)
	{
		return next(req);
	}

	// eslint-disable-next-line no-console
	console.log(`🔵 HTTP Request: ${req.method} ${req.url}`);

	return next(req).pipe(
		tap({
			next: (event) =>
			{
				if (event.type !== 0)
				{
					// Not a sent event
					const duration = Date.now() - startTime;
					// eslint-disable-next-line no-console
					console.log(
						`🟢 HTTP Response: ${req.method} ${req.url} (${duration}ms)`
					);
				}
			},
			error: (error) =>
			{
				const duration = Date.now() - startTime;
				console.error(
					`🔴 HTTP Error: ${req.method} ${req.url} (${duration}ms)`,
					error
				);
			}
		}),
		finalize(() =>
		{
			// Cleanup if needed
		})
	);
};
