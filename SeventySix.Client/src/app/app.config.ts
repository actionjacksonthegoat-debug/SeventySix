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

import { routes } from "./app.routes";
import {
	errorInterceptor,
	loggingInterceptor,
	authInterceptor,
	cacheInterceptor
} from "@core/interceptors";
import { ErrorHandlerService, ThemeService } from "@core/services";

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
		provideHttpClient(
			withInterceptors([
				cacheInterceptor, // Cache before auth/logging
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
		// Service Worker for PWA support and advanced caching
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(),
			registrationStrategy: "registerWhenStable:30000"
		})
	]
};
