import {
	provideHttpClient,
	withInterceptors,
	withXsrfConfiguration
} from "@angular/common/http";
import {
	APP_INITIALIZER,
	ApplicationConfig,
	ErrorHandler,
	isDevMode,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection
} from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import {
	provideRouter,
	withPreloading
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { provideNgxSkeletonLoader } from "ngx-skeleton-loader";

import { environment } from "@environments/environment";
import {
	authInterceptor,
	cacheBypassInterceptor,
	dateParserInterceptor,
	errorInterceptor,
	loggingInterceptor
} from "@shared/interceptors";
import {
	AuthService,
	ErrorHandlerService,
	SelectivePreloadingStrategy,
	TelemetryService,
	ThemeService,
	WebVitalsService
} from "@shared/services";
import { routes } from "./app.routes";

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

/**
 * Initialize OpenTelemetry on app startup
 * This ensures tracing is active before any HTTP requests
 */
function initializeTelemetry(telemetryService: TelemetryService)
{
	return () =>
	{
		telemetryService.initialize();
		return Promise.resolve();
	};
}

/**
 * Initialize Web Vitals monitoring on app startup
 * The WebVitalsService constructor handles initialization automatically
 */
function initializeWebVitals(_webVitalsService: WebVitalsService)
{
	return () =>
	{
		// Web vitals service constructor handles initialization
		return Promise.resolve();
	};
}

/**
 * Initialize auth service on app startup
 * Handles OAuth callback processing and restores auth state
 */
function initializeAuth(authService: AuthService)
{
	return () =>
	{
		return authService.initialize();
	};
}

export const appConfig: ApplicationConfig =
	{
		providers: [
		// TanStack Query with environment-based configuration
			provideTanStackQuery(
				new QueryClient(
					{
						defaultOptions: {
							queries: {
								staleTime: environment.cache.query.default.staleTime,
								gcTime: environment.cache.query.default.gcTime,
								retry: environment.cache.query.default.retry,
								refetchOnWindowFocus: environment
								.cache
								.query
								.default
								.refetchOnWindowFocus,
								refetchOnReconnect: environment.cache.query.default.refetchOnReconnect
							}
						}
					})),
			provideHttpClient(
				withInterceptors(
					[
						cacheBypassInterceptor,
						dateParserInterceptor,
						authInterceptor,
						loggingInterceptor,
						errorInterceptor
					]),
				// Enable XSRF protection
				withXsrfConfiguration(
					{
						cookieName: "XSRF-TOKEN",
						headerName: "X-XSRF-TOKEN"
					})),
			provideBrowserGlobalErrorListeners(),
			provideZonelessChangeDetection(),
			provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
			provideAnimations(),
			// Global error handler
			{ provide: ErrorHandler, useClass: ErrorHandlerService },
			// Initialize theme service on app startup
			{
				provide: APP_INITIALIZER,
				useFactory: initializeTheme,
				deps: [ThemeService],
				multi: true
			},
			// Initialize OpenTelemetry on app startup
			{
				provide: APP_INITIALIZER,
				useFactory: initializeTelemetry,
				deps: [TelemetryService],
				multi: true
			},
			// Initialize Web Vitals monitoring on app startup
			{
				provide: APP_INITIALIZER,
				useFactory: initializeWebVitals,
				deps: [WebVitalsService],
				multi: true
			},
			// Initialize auth service on app startup (handles OAuth callbacks)
			{
				provide: APP_INITIALIZER,
				useFactory: initializeAuth,
				deps: [AuthService],
				multi: true
			},
			// Service Worker for PWA support and asset caching only
			provideServiceWorker("ngsw-worker.js",
				{
					enabled: !isDevMode(),
					registrationStrategy: "registerWhenStable:30000"
				}),
			// Skeleton loader for loading states
			provideNgxSkeletonLoader(
				{
					animation: "pulse",
					theme: {
						extendsFromRoot: true
					}
				})
		]
	};
