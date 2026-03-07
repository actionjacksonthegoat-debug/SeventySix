import {
	provideHttpClient,
	withInterceptors
} from "@angular/common/http";
import {
	ApplicationConfig,
	ErrorHandler,
	inject,
	Injector,
	isDevMode,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
	runInInjectionContext
} from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
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
import { AuthResponse } from "@shared/models";
import {
	AuthService,
	ErrorHandlerService,
	FeatureFlagsService,
	SelectivePreloadingStrategy,
	ThemeService
} from "@shared/services";
import { registerOAuthIcons } from "@shared/utilities/oauth-icons.utility";
import { Observable } from "rxjs";
import { routes } from "./app.routes";

const NON_CRITICAL_INIT_TIMEOUT_MS: number = 3000;

function scheduleNonCriticalInitialization(task: () => Promise<void> | void): void
{
	if (typeof window === "undefined")
	{
		void Promise.resolve(task());
		return;
	}

	const runTask: () => void =
		(): void =>
		{
			if ("requestIdleCallback" in window)
			{
				window.requestIdleCallback(
					() =>
					{
						void Promise.resolve(task());
					},
					{ timeout: NON_CRITICAL_INIT_TIMEOUT_MS });
				return;
			}

			globalThis.setTimeout(
				() =>
				{
					void Promise.resolve(task());
				},
				NON_CRITICAL_INIT_TIMEOUT_MS);
		};

	if (document.readyState === "complete")
	{
		runTask();
		return;
	}

	window.addEventListener(
		"load",
		runTask,
		{ once: true });
}

/**
 * Initialize theme service on app startup.
 * Ensures the theme is applied before the app renders.
 * @returns {Promise<void>}
 * Resolves when theme initialization is complete.
 */
function initializeTheme(): Promise<void>
{
	const themeService: ThemeService =
		inject(ThemeService);
	themeService.initialize();
	return Promise.resolve();
}

/**
 * Defers OpenTelemetry initialization until after page load.
 * Uses requestIdleCallback to avoid competing with first paint.
 */
function initializeTelemetry(): Promise<void>
{
	const injector: Injector =
		inject(Injector);

	scheduleNonCriticalInitialization(
		async () =>
		{
			const telemetryModule: typeof import("@shared/services/telemetry.service") =
				await import(
					"@shared/services/telemetry.service");

			runInInjectionContext(
				injector,
				() =>
				{
					inject(telemetryModule.TelemetryService)
						.initialize();
				});
		});

	return Promise.resolve();
}

/**
 * Defers Web Vitals monitoring initialization until after page load.
 * Uses requestIdleCallback to avoid competing with first paint.
 */
function initializeWebVitals(): Promise<void>
{
	const injector: Injector =
		inject(Injector);

	scheduleNonCriticalInitialization(
		async () =>
		{
			const webVitalsModule: typeof import("@shared/services/web-vitals.service") =
				await import(
					"@shared/services/web-vitals.service");

			runInInjectionContext(
				injector,
				() =>
				{
					inject(webVitalsModule.WebVitalsService);
				});
		});

	return Promise.resolve();
}

/**
 * Initialize auth service on app startup
 * Handles OAuth callback processing and restores auth state
 */
function initializeAuth(): Observable<AuthResponse | null>
{
	const authService: AuthService =
		inject(AuthService);
	return authService.initialize();
}

/**
 * Loads feature flags from the API during app startup.
 * All APP_INITIALIZERs run in parallel, so this only adds latency beyond
 * the slowest other initializer (typically initializeAuth for returning users).
 * For first-time visitors, this adds ~50–200 ms but guarantees correct UI state
 * (OAuth buttons, ALTCHA, TOTP) on the very first render — no flicker.
 */
function initializeFeatureFlags(): Promise<void>
{
	const featureFlagsService: FeatureFlagsService =
		inject(FeatureFlagsService);
	return featureFlagsService.initialize();
}

/**
 * Register OAuth provider SVG icons with the Material icon registry.
 * Must run before any component references these icons.
 */
function initializeOAuthIcons(): Promise<void>
{
	const iconRegistry: MatIconRegistry =
		inject(MatIconRegistry);
	const sanitizer: DomSanitizer =
		inject(DomSanitizer);
	registerOAuthIcons(iconRegistry, sanitizer);
	return Promise.resolve();
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
		provideAppInitializer(initializeOAuthIcons),
		provideAppInitializer(initializeFeatureFlags),
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
					])),
			provideBrowserGlobalErrorListeners(),
			provideZonelessChangeDetection(),
			provideRouter(routes, withPreloading(SelectivePreloadingStrategy)),
			provideAnimationsAsync(),
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