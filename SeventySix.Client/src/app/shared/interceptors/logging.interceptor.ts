/**
 * Logging Interceptor
 * Logs HTTP requests and responses for debugging via LoggerService
 */

import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { environment } from "@environments/environment";
import { DateService } from "@shared/services";
import { LoggerService } from "@shared/services/logger.service";
import { tap } from "rxjs";

/**
 * Intercepts HTTP requests/responses for logging
 * Respects consoleLogLevel configuration - only logs if level is 'debug' or 'info'
 */
export const loggingInterceptor: HttpInterceptorFn =
	(req, next) =>
	{
		const dateService: DateService =
			inject(DateService);
		const loggerService: LoggerService =
			inject(LoggerService);
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

		loggerService.debug(
			`HTTP Request: ${req.method} ${req.url}`);

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
								loggerService.debug(
									`HTTP Response: ${req.method} ${req.url} (${duration}ms)`);
							}
						},
						error: (error: unknown) =>
						{
							const duration: number =
								dateService.nowTimestamp() - startTime;
							// Always log HTTP errors regardless of log level
							loggerService.error(
								`HTTP Error: ${req.method} ${req.url} (${duration}ms)`,
								error instanceof Error ? error : undefined);
						}
					}));
	};