/**
 * Provider helpers for testing.
 * Reduces duplication of common provider configurations across test files.
 * Follows DRY and KISS principles.
 */

import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
	EnvironmentProviders,
	Provider,
	provideZonelessChangeDetection
} from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, Route } from "@angular/router";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";

/**
 * Creates a QueryClient configured for testing.
 * Disables retries and sets short cache times for test isolation.
 *
 * @returns {QueryClient}
 * Pre-configured QueryClient for tests.
 */
function createTestQueryClientInternal(): QueryClient
{
	return new QueryClient(
		{
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false }
			}
		});
}

/**
 * Provider type union for cleaner arrays.
 */
export type TestProvider = Provider | EnvironmentProviders;

/**
 * Provides HTTP client configured for testing.
 * Includes HttpClient with fetch API and HttpTestingController.
 *
 * @returns {TestProvider[]}
 * Array of providers for HTTP testing.
 *
 * @example
 * TestBed.configureTestingModule({
 *   providers: [...withHttpTesting()]
 * });
 */
export function withHttpTesting(): TestProvider[]
{
	return [
		provideHttpClient(withFetch()),
		provideHttpClientTesting()
	];
}

/**
 * Provides TanStack Query configured for testing.
 * Uses provided QueryClient or creates new test-configured one.
 *
 * @param {QueryClient} [queryClient]
 * Optional QueryClient instance. If not provided, creates one with retry disabled.
 * @returns {TestProvider[]}
 * Array of providers for TanStack Query testing.
 *
 * @example
 * // With auto-created QueryClient
 * TestBed.configureTestingModule({
 *   providers: [...withQueryTesting()]
 * });
 *
 * // With custom QueryClient
 * const queryClient = createTestQueryClient();
 * TestBed.configureTestingModule({
 *   providers: [...withQueryTesting(queryClient)]
 * });
 */
export function withQueryTesting(queryClient?: QueryClient): TestProvider[]
{
	const client: QueryClient =
		queryClient ?? createTestQueryClientInternal();
	return [provideTanStackQuery(client)];
}

/**
 * Provides Angular Router configured for testing.
 * Optionally accepts route configuration.
 *
 * @param {Route[]} [routes]
 * Optional route configuration. Defaults to empty routes.
 * @returns {TestProvider[]}
 * Array of providers for router testing.
 *
 * @example
 * TestBed.configureTestingModule({
 *   providers: [...withRouterTesting()]
 * });
 */
export function withRouterTesting(routes?: Route[]): TestProvider[]
{
	return [provideRouter(routes ?? [])];
}

/**
 * Provides animations configured for testing.
 *
 * @returns {TestProvider[]}
 * Array of providers for animation testing.
 *
 * @example
 * TestBed.configureTestingModule({
 *   providers: [...withAnimationsTesting()]
 * });
 */
export function withAnimationsTesting(): TestProvider[]
{
	return [provideAnimations()];
}

/**
 * Provides zoneless change detection for testing.
 * Required for all Angular tests in this project.
 *
 * @returns {TestProvider[]}
 * Array of providers for zoneless testing.
 *
 * @example
 * TestBed.configureTestingModule({
 *   providers: [...withZonelessTesting()]
 * });
 */
export function withZonelessTesting(): TestProvider[]
{
	return [provideZonelessChangeDetection()];
}

/**
 * Provides common providers for service tests.
 * Includes zoneless change detection.
 *
 * @returns {TestProvider[]}
 * Array of common service test providers.
 *
 * @example
 * TestBed.configureTestingModule({
 *   providers: [
 *     ...withServiceDefaults(),
 *     MyService
 *   ]
 * });
 */
export function withServiceDefaults(): TestProvider[]
{
	return [provideZonelessChangeDetection()];
}

/**
 * Provides common providers for component tests.
 * Includes zoneless change detection and animations.
 *
 * @returns {TestProvider[]}
 * Array of common component test providers.
 *
 * @example
 * TestBed.configureTestingModule({
 *   imports: [MyComponent],
 *   providers: [...withComponentDefaults()]
 * });
 */
export function withComponentDefaults(): TestProvider[]
{
	return [
		provideZonelessChangeDetection(),
		provideAnimations()
	];
}

/**
 * Provides common providers for API service tests.
 * Includes zoneless, HTTP testing, and TanStack Query.
 *
 * @param {QueryClient} [queryClient]
 * Optional QueryClient instance.
 * @returns {{ providers: TestProvider[]; queryClient: QueryClient; }}
 * Object with providers array and QueryClient reference.
 *
 * @example
 * const { providers, queryClient } = withApiServiceDefaults();
 * TestBed.configureTestingModule({ providers });
 * afterEach(() => queryClient.clear());
 */
export function withApiServiceDefaults(queryClient?: QueryClient): {
	providers: TestProvider[];
	queryClient: QueryClient;
}
{
	const client: QueryClient =
		queryClient ?? createTestQueryClientInternal();
	return {
		providers: [
			provideZonelessChangeDetection(),
			provideHttpClient(withFetch()),
			provideHttpClientTesting(),
			provideTanStackQuery(client)
		],
		queryClient: client
	};
}
