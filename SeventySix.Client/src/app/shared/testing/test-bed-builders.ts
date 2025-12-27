/**
 * Test Bed Builder Utilities
 * Eliminates test setup duplication by providing fluent builder pattern
 * Follows KISS and DRY principles
 */

import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import {
	EnvironmentProviders,
	Provider,
	provideZonelessChangeDetection,
	Type
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations"; // Replace by V23
import { provideRouter } from "@angular/router";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { type Mock, vi } from "vitest";

/**
 * Fluent builder for component test configuration
 * Reduces test setup from 50+ lines to ~15 lines
 *
 * @example
 * const fixture = await new ComponentTestBed<UserList>()
 *     .withMockService(UserService, ["getAllUsers", "deleteUser"])
 *     .withMockService(LoggerService, ["info", "error"])
 *     .build(UserList);
 */
export class ComponentTestBed<T>
{
	private providers: (Provider | EnvironmentProviders)[] = [];
	private imports: Type<object>[] = [];

	/**
	 * Add a mocked service to the test configuration
	 * Automatically creates Vitest mock functions
	 *
	 * @param {Type<S>} token
	 * Service class or injection token
	 * @param {string[]} methods
	 * Array of method names to spy on
	 * @returns {this}
	 * this for chaining
	 */
	withMockService<S>(token: Type<S>, methods: string[]): this
	{
		const mock: Record<string, Mock> = {};
		for (const methodName of methods)
		{
			mock[methodName] =
				vi.fn();
		}
		this.providers.push(
			{ provide: token, useValue: mock as unknown as S });
		return this;
	}

	/**
	 * Add a real service instance to the test configuration
	 *
	 * @param {Type<S>} token
	 * Service class
	 * @returns {this}
	 * this for chaining
	 */
	withRealService<S>(token: Type<S>): this
	{
		this.providers.push(token);
		return this;
	}

	/**
	 * Add a custom provider to the test configuration
	 * Supports both Provider and EnvironmentProviders (e.g., provideRouter)
	 *
	 * @param {Provider | EnvironmentProviders} provider
	 * Angular provider object
	 * @returns {this}
	 * this for chaining
	 */
	withProvider(provider: Provider | EnvironmentProviders): this
	{
		this.providers.push(provider);
		return this;
	}

	/**
	 * Configure component inputs after build
	 * Reduces repetitive fixture.componentRef.setInput calls
	 *
	 * @param {Record<string, unknown>} inputs
	 * Object with input names as keys and values
	 * @param {ComponentFixture<T>} fixture
	 * Component fixture to apply inputs to
	 * @returns {void}
	 *
	 * @example
	 * const builder = new ComponentTestBed<DataTableComponent>();
	 * const fixture = await builder.build(DataTableComponent);
	 * builder.withInputs(fixture, { columns: mockColumns, data: mockData });
	 */
	withInputs(
		fixture: ComponentFixture<T>,
		inputs: Record<string, unknown>): void
	{
		for (const [key, value] of Object.entries(inputs))
		{
			fixture.componentRef.setInput(key, value);
		}
		fixture.detectChanges();
	}

	/**
	 * Add a spy for a component output event
	 * Simplifies testing component outputs
	 *
	 * @param {ComponentFixture<T>} fixture
	 * Component fixture
	 * @param {string} outputName
	 * Name of the output property
	 * @returns {Mock}
	 * Vitest mock that can be used for assertions
	 *
	 * @example
	 * const fixture = await builder.build(DataTableComponent);
	 * const refreshSpy = builder.withOutputSpy(fixture, 'refreshClick');
	 * component.onRefresh();
	 * expect(refreshSpy).toHaveBeenCalled();
	 */
	withOutputSpy(
		fixture: ComponentFixture<T>,
		outputName: string): Mock
	{
		const spy: Mock =
			vi.fn();
		const component: T =
			fixture.componentInstance as T;
		const output: { subscribe?: (observer: Mock) => void; } | undefined =
			(component as Record<string, unknown>)[outputName] as
				| { subscribe?: (observer: Mock) => void; }
				| undefined;
		if (output && typeof output.subscribe === "function")
		{
			output.subscribe(spy);
		}
		return spy;
	}

	/**
	 * Add admin page defaults to test configuration
	 * Automatically includes HTTP client, TanStack Query, and router
	 * Reduces test setup from 20+ lines to 1 line for admin components
	 *
	 * @returns {this}
	 * this for chaining
	 *
	 * @example
	 * const fixture = await new ComponentTestBed<UserList>()
	 *     .withAdminDefaults()
	 *     .withRealService(UserService)
	 *     .withRealService(UserRepository)
	 *     .build(UserList);
	 */
	withAdminDefaults(): this
	{
		const queryClient: QueryClient =
			createTestQueryClient();
		this.providers.push(
			provideHttpClient(withFetch()),
			provideHttpClientTesting(),
			provideRouter([]),
			provideTanStackQuery(queryClient));
		return this;
	}

	/**
	 * Add an import (module or standalone component) to the test configuration
	 *
	 * @param {Type<object>} importItem
	 * Module or standalone component
	 * @returns {this}
	 * this for chaining
	 */
	withImport(importItem: Type<object>): this
	{
		this.imports.push(importItem);
		return this;
	}

	/**
	 * Build and compile the test component
	 * Automatically includes provideZonelessChangeDetection and provideNoopAnimations
	 * for faster test execution without animation overhead
	 *
	 * @param {Type<T>} component
	 * Component class to test
	 * @returns {Promise<ComponentFixture<T>>}
	 * Promise resolving to ComponentFixture
	 */
	async build(component: Type<T>): Promise<ComponentFixture<T>>
	{
		await TestBed
		.configureTestingModule(
			{
				imports: [component, ...this.imports],
				providers: [
					provideZonelessChangeDetection(),
					provideAnimations(),
					...this.providers
				]
			})
		.compileComponents();

		return TestBed.createComponent(component);
	}

	/**
	 * Get a service instance from the TestBed
	 * Useful for accessing mocked services after build
	 *
	 * @param {Type<S>} token
	 * Service class or injection token
	 * @returns {S}
	 * Service instance
	 */
	getService<S>(token: Type<S>): S
	{
		return TestBed.inject(token);
	}
}

/**
 * Creates a test QueryClient with retry disabled for faster tests.
 * Eliminates duplication of QueryClient configuration across 40+ test files.
 * Follows DRY principle.
 *
 * @returns {QueryClient}
 * QueryClient configured for testing.
 *
 * @example
 * const queryClient = createTestQueryClient();
 * TestBed.configureTestingModule({
 *   providers: [provideTanStackQuery(queryClient)]
 * });
 */
export function createTestQueryClient(): QueryClient
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
 * Sets up a service test with standard configuration
 * Eliminates 200+ lines of duplicated TestBed setup across test files
 * Automatically includes zoneless change detection and TanStack Query
 * Follows DRY and KISS principles
 *
 * @param {Type<T>} service
 * Service class to test
 * @param {Provider[]} providers
 * Additional providers (e.g., mocked dependencies)
 * @returns {{ service: T; queryClient: QueryClient; }}
 * Object containing service instance and QueryClient
 *
 * @example
 * describe("UserService", () => {
 *   let service: UserService;
 *   let mockRepository: { getAll: Mock; getById: Mock; };
 *
 *   beforeEach(() => {
 *     mockRepository = { getAll: vi.fn(), getById: vi.fn() };
 *     const setup = setupServiceTest(UserService, [
 *       { provide: UserRepository, useValue: mockRepository }
 *     ]);
 *     service = setup.service;
 *   });
 * });
 */
export function setupServiceTest<T>(
	service: Type<T>,
	providers: Provider[] = []): { service: T; queryClient: QueryClient; }
{
	const queryClient: QueryClient =
		createTestQueryClient();

	TestBed.configureTestingModule(
		{
			providers: [
				provideZonelessChangeDetection(),
				provideTanStackQuery(queryClient),
				service,
				...providers
			]
		});

	return {
		service: TestBed.inject(service),
		queryClient
	};
}

/**
 * Sets up a repository test with standard configuration
 * Eliminates TestBed duplication in repository tests
 * Automatically includes zoneless change detection and HTTP testing
 * Follows DRY and KISS principles
 *
 * @param {Type<T>} repository
 * Repository class to test
 * @param {(Provider | EnvironmentProviders)[]} providers
 * Additional providers (e.g., mocked ApiService)
 * @returns {T}
 * Repository instance
 *
 * @example
 * describe("UserRepository", () => {
 *   let repository: UserRepository;
 *   let mockApiService: { get: Mock; post: Mock; put: Mock; delete: Mock; };
 *
 *   beforeEach(() => {
 *     mockApiService = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
 *     repository = setupRepositoryTest(UserRepository, [
 *       { provide: ApiService, useValue: mockApiService }
 *     ]);
 *   });
 * });
 */
export function setupRepositoryTest<T>(
	repository: Type<T>,
	providers: (Provider | EnvironmentProviders)[] = []): T
{
	TestBed.configureTestingModule(
		{
			providers: [provideZonelessChangeDetection(), repository, ...providers]
		});

	return TestBed.inject(repository);
}

/**
 * Sets up a simple service test without TanStack Query
 * For services that don't need query/mutation capabilities
 * Automatically includes zoneless change detection
 * Follows DRY and KISS principles
 *
 * @param {Type<T>} service
 * Service class to test
 * @param {(Provider | EnvironmentProviders)[]} providers
 * Additional providers (e.g., mocked dependencies)
 * @param {Type<object>[]} imports
 * Optional imports (e.g., HttpClientTestingModule)
 * @returns {T}
 * Service instance
 *
 * @example
 * describe("LoggerService", () => {
 *   let service: LoggerService;
 *
 *   beforeEach(() => {
 *     service = setupSimpleServiceTest(LoggerService, [], [HttpClientTestingModule]);
 *   });
 * });
 */
export function setupSimpleServiceTest<T>(
	service: Type<T>,
	providers: (Provider | EnvironmentProviders)[] = [],
	imports: Type<object>[] = []): T
{
	TestBed.configureTestingModule(
		{
			imports,
			providers: [provideZonelessChangeDetection(), service, ...providers]
		});

	return TestBed.inject(service);
}

/**
 * Utility to create a promise that resolves after specified milliseconds.
 * Uses globalThis.setTimeout for compatibility with zoneless Angular tests.
 * Prefer this over raw setTimeout with done() callback pattern.
 *
 * @param {number} ms
 * Milliseconds to delay
 * @returns {Promise<void>}
 * Promise that resolves after the delay
 *
 * @example
 * it("should debounce resize events", async () => {
 *   window.dispatchEvent(new Event("resize"));
 *   await delay(600); // Wait for 500ms debounce + buffer
 *   expect(spy).toHaveBeenCalledTimes(1);
 * });
 */
export function delay(ms: number): Promise<void>
{
	return new Promise(
		(resolve: () => void) =>
			globalThis.setTimeout(resolve, ms));
}

/**
 * Utility to flush pending microtasks for TanStack Query tests.
 * Uses setTimeout(0) to push to macrotask queue, allowing TanStack Query
 * to complete HTTP request initiation in zoneless Angular.
 *
 * @returns {Promise<void>}
 * Promise that resolves after microtasks and pending work are flushed
 *
 * @example
 * it("should fetch data", async () => {
 *   const query = service.getData();
 *   await flushMicrotasks();
 *   httpMock.expectOne(url).flush(mockData);
 *   await flushMicrotasks();
 *   expect(query.data()).toEqual(mockData);
 * });
 */
export function flushMicrotasks(): Promise<void>
{
	return new Promise(
		(resolve: () => void) =>
			globalThis.setTimeout(resolve, 0));
}
