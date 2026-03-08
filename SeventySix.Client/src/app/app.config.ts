import {
	provideHttpClient,
	withFetch,
	withInterceptors
} from "@angular/common/http";
import {
	ApplicationConfig,
	effect,
	ErrorHandler,
	inject,
	Injector,
	isDevMode,
	provideAppInitializer,
	provideBrowserGlobalErrorListeners,
	provideZonelessChangeDetection,
	runInInjectionContext,
	untracked
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
	MutationCache,
	provideTanStackQuery,
	QueryCache,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { provideNgxSkeletonLoader } from "ngx-skeleton-loader";

import { environment } from "@environments/environment";
import {
	BROWSER_FEATURE,
	DOCUMENT_READY_STATE,
	TYPEOF_RESULT,
	WINDOW_EVENT
} from "@shared/constants";
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

/**
 * Module-level reference to the ErrorHandler, captured during app initialization.
 * Used by QueryCache/MutationCache onError callbacks which fire outside injection context.
 */
let cachedErrorHandler: ErrorHandler | undefined;

function scheduleNonCriticalInitialization(task: () => Promise<void> | void): void
{
	if (typeof window === TYPEOF_RESULT.UNDEFINED)
	{
		void Promise.resolve(task());
		return;
	}

	const runTask: () => void =
		(): void =>
		{
			if (BROWSER_FEATURE.IDLE_CALLBACK in window)
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

	if (document.readyState === DOCUMENT_READY_STATE.COMPLETE)
	{
		runTask();
		return;
	}

	window.addEventListener(
		WINDOW_EVENT.LOAD,
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

	// Capture ErrorHandler for QueryCache/MutationCache callbacks
	cachedErrorHandler =
		inject(ErrorHandler);

	return Promise.resolve();
}

/**
 * Defers OpenTelemetry initialization until after page load.
 * Uses requestIdleCallback to avoid competing with first paint.
 * Only initializes for authenticated users to prevent telemetry abuse.
 * Reactively watches auth state so telemetry activates after login.
 */
function initializeTelemetry(): Promise<void>
{
	const injector: Injector =
		inject(Injector);

	scheduleNonCriticalInitialization(
		() =>
		{
			runInInjectionContext(
				injector,
				() =>
				{
					const authService: AuthService =
						inject(AuthService);

					// Reactively watch auth state.
					// Activates telemetry when user becomes authenticated,
					// shuts it down on logout to stop tracing.
					effect(
						() =>
						{
							const authenticated: boolean =
								authService.isAuthenticated();

							untracked(
								() =>
								{
									if (authenticated)
									{
										void activateTelemetry(injector);
									}
									else
									{
										void deactivateTelemetry(injector);
									}
								});
						});
				});
		});

	return Promise.resolve();
}

/**
 * Dynamically imports and initializes the TelemetryService.
 * Separated from the effect to keep async work untracked.
 */
async function activateTelemetry(injector: Injector): Promise<void>
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
}

/**
 * Shuts down telemetry when user logs out.
 * Dynamically imports the service to avoid adding it to the main bundle.
 */
async function deactivateTelemetry(injector: Injector): Promise<void>
{
	const telemetryModule: typeof import("@shared/services/telemetry.service") =
		await import(
			"@shared/services/telemetry.service");

	runInInjectionContext(
		injector,
		() =>
		{
			void inject(telemetryModule.TelemetryService)
				.shutdown();
		});
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
 * Loads feature flags from the API after initial render.
 * Deferred via scheduleNonCriticalInitialization since the landing page
 * doesn't use feature flags — only auth, account, and policy pages do.
 */
function initializeFeatureFlags(): Promise<void>
{
	const injector: Injector =
		inject(Injector);

	scheduleNonCriticalInitialization(
		async () =>
		{
			await runInInjectionContext(
				injector,
				() =>
				{
					const featureFlagsService: FeatureFlagsService =
						inject(FeatureFlagsService);
					return featureFlagsService.initialize();
				});
		});

	return Promise.resolve();
}

/**
 * Register OAuth provider SVG icons with the Material icon registry.
 * Deferred to after page load since these icons are only needed on auth pages.
 */
function initializeOAuthIcons(): Promise<void>
{
	const injector: Injector =
		inject(Injector);

	scheduleNonCriticalInitialization(
		() =>
		{
			runInInjectionContext(
				injector,
				() =>
				{
					const iconRegistry: MatIconRegistry =
						inject(MatIconRegistry);
					const sanitizer: DomSanitizer =
						inject(DomSanitizer);
					registerOAuthIcons(iconRegistry, sanitizer);
				});
		});

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
						queryCache: new QueryCache(
							{
								onError: (error: Error): void =>
								{
									cachedErrorHandler?.handleError(error);
								}
							}),
						mutationCache: new MutationCache(
							{
								onError: (error: Error): void =>
								{
									cachedErrorHandler?.handleError(error);
								}
							}),
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
				withFetch(),
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