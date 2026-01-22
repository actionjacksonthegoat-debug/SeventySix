import {
	provideHttpClient,
	withInterceptors,
	withXsrfConfiguration
} from "@angular/common/http";
import {
	ApplicationConfig,
	ErrorHandler,
	inject,
	isDevMode,
	provideAppInitializer,
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
import { HTTP_HEADER_XSRF_TOKEN } from "@shared/constants/http.constants";
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
function initializeTheme()
{
	inject(ThemeService);
	// Theme service constructor handles initialization
	return Promise.resolve();
}

/**
 * Initialize OpenTelemetry on app startup
 * This ensures tracing is active before any HTTP requests
 */
function initializeTelemetry()
{
	const telemetryService: TelemetryService =
		inject(TelemetryService);
	telemetryService.initialize();
	return Promise.resolve();
}

/**
 * Initialize Web Vitals monitoring on app startup
 * The WebVitalsService constructor handles initialization automatically
 */
function initializeWebVitals()
{
	inject(WebVitalsService);
	// Web vitals service constructor handles initialization
	return Promise.resolve();
}

/**
 * Initialize auth service on app startup
 * Handles OAuth callback processing and restores auth state
 */
function initializeAuth()
{
	const authService: AuthService =
		inject(AuthService);
	return authService.initialize();
}

/**
 * Global application configuration for Angular `ApplicationConfig`.
 * Registers providers: TanStack Query, HTTP interceptors, router, APP_INITIALIZER hooks, and debug/production services.
 */
const appInitializers: ReturnType<typeof provideAppInitializer>[] =
	[
		provideAppInitializer(initializeTheme),
		provideAppInitializer(initializeTelemetry),
		provideAppInitializer(initializeWebVitals),
		provideAppInitializer(initializeAuth)
	];

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
						headerName: HTTP_HEADER_XSRF_TOKEN
					})),
			provideBrowserGlobalErrorListeners(),
			provideZonelessChangeDetection(),
			provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
			provideAnimations(), // Fix in Angular V22
			// Global error handler
			{ provide: ErrorHandler, useClass: ErrorHandlerService },
			// Application initializers consolidated
			...appInitializers,
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
