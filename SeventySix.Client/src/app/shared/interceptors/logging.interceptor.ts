/**
 * Logging Interceptor
 * Logs HTTP requests and responses for debugging
 */

import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { environment } from "@environments/environment";
import { DateService } from "@shared/services";
import { finalize, tap } from "rxjs";

/**
 * Intercepts HTTP requests/responses for logging
 * Respects consoleLogLevel configuration - only logs if level is 'debug' or 'info'
 */
export const loggingInterceptor: HttpInterceptorFn =
	(req, next) =>
	{
		const dateService: DateService =
			inject(DateService);
		const startTime: number =
			dateService.nowTimestamp();
		const logLevel: string =
			environment.logging.consoleLogLevel;

		// Only log HTTP requests at debug/info level
		// Skip logging if consoleLogLevel is warn, error, or none
		const shouldLog: boolean =
			logLevel === "debug" || logLevel === "info";

		if (!shouldLog)
		{
			return next(req);
		}

		// eslint-disable-next-line no-console
		console.log(`🔵 HTTP Request: ${req.method} ${req.url}`);

		return next(req)
			.pipe(
				tap(
					{
						next: (event) =>
						{
							if (event.type !== 0)
							{
							// Not a sent event
								const duration: number =
									dateService.nowTimestamp() - startTime;
								// eslint-disable-next-line no-console
								console.log(
									`🟢 HTTP Response: ${req.method} ${req.url} (${duration}ms)`);
							}
						},
						error: (error) =>
						{
							const duration: number =
								dateService.nowTimestamp() - startTime;
							// Always log HTTP errors regardless of log level
							console.error(
								`🔴 HTTP Error: ${req.method} ${req.url} (${duration}ms)`,
								error);
						}
					}),
				finalize(
					() =>
					{
					// Cleanup if needed
					}));
	};
