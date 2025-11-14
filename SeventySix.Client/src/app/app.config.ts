import {
	ApplicationConfig,
	ErrorHandler,
	isDevMode,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
	APP_INITIALIZER
} from "@angular/core";
import { provideRouter } from "@angular/router";
import {
	provideHttpClient,
	withInterceptors,
	withXsrfConfiguration
} from "@angular/common/http";
import { provideServiceWorker } from "@angular/service-worker";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import {
	provideAngularQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";

import { routes } from "./app.routes";
import {
	errorInterceptor,
	loggingInterceptor,
	authInterceptor
} from "@core/interceptors";
import { ErrorHandlerService, ThemeService } from "@core/services";
import { environment } from "@environments/environment";

/**
 * Initialize theme service on app startup
 * This ensures the theme is applied before the app renders
 */
function initializeTheme(_themeService: ThemeService)
{
	return () =>
	{
		// Theme service constructor handles initialization
		return Promise.resolve();
	};
}

export const appConfig: ApplicationConfig = {
	providers: [
		// TanStack Query with environment-based configuration
		provideAngularQuery(
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: environment.cache.query.default.staleTime,
						gcTime: environment.cache.query.default.gcTime,
						retry: environment.cache.query.default.retry,
						refetchOnWindowFocus:
							environment.cache.query.default
								.refetchOnWindowFocus,
						refetchOnReconnect:
							environment.cache.query.default.refetchOnReconnect
					}
				}
			})
		),
		provideHttpClient(
			withInterceptors([
				authInterceptor,
				loggingInterceptor,
				errorInterceptor
			]),
			// Enable XSRF protection
			withXsrfConfiguration({
				cookieName: "XSRF-TOKEN",
				headerName: "X-XSRF-TOKEN"
			})
		),
		provideBrowserGlobalErrorListeners(),
		provideZonelessChangeDetection(),
		provideRouter(routes),
		provideAnimationsAsync(),
		// Global error handler
		{ provide: ErrorHandler, useClass: ErrorHandlerService },
		// Initialize theme service on app startup
		{
			provide: APP_INITIALIZER,
			useFactory: initializeTheme,
			deps: [ThemeService],
			multi: true
		},
		// Service Worker for PWA support and asset caching only
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000"
		})
	]
};
