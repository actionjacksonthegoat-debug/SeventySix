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
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";

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
	 * Automatically creates jasmine spy object
	 *
	 * @param token - Service class or injection token
	 * @param methods - Array of method names to spy on
	 * @returns this for chaining
	 */
	withMockService<S>(token: Type<S>, methods: string[]): this
	{
		const mock: jasmine.SpyObj<S> =
			jasmine.createSpyObj(
			token.name,
			methods);
		this.providers.push({ provide: token, useValue: mock });
		return this;
	}

	/**
	 * Add a real service instance to the test configuration
	 *
	 * @param token - Service class
	 * @returns this for chaining
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
	 * @param provider - Angular provider object
	 * @returns this for chaining
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
	 * @param inputs - Object with input names as keys and values
	 * @param fixture - Component fixture to apply inputs to
	 * @returns void
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
	 * @param fixture - Component fixture
	 * @param outputName - Name of the output property
	 * @returns Jasmine spy that can be used for assertions
	 *
	 * @example
	 * const fixture = await builder.build(DataTableComponent);
	 * const refreshSpy = builder.withOutputSpy(fixture, 'refreshClick');
	 * component.onRefresh();
	 * expect(refreshSpy).toHaveBeenCalled();
	 */
	withOutputSpy(
		fixture: ComponentFixture<T>,
		outputName: string): jasmine.Spy
	{
		const spy: jasmine.Spy =
			jasmine.createSpy(outputName);
		const component: T =
			fixture.componentInstance as T;
		const output: { subscribe?: (observer: jasmine.Spy) => void; } | undefined =
			(component as Record<string, unknown>)[outputName] as
				| { subscribe?: (observer: jasmine.Spy) => void; }
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
	 * @returns this for chaining
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
	 * @param importItem - Module or standalone component
	 * @returns this for chaining
	 */
	withImport(importItem: Type<object>): this
	{
		this.imports.push(importItem);
		return this;
	}

	/**
	 * Build and compile the test component
	 * Automatically includes provideZonelessChangeDetection and provideNoopAnimations
	 *
	 * @param component - Component class to test
	 * @returns Promise resolving to ComponentFixture
	 */
	async build(component: Type<T>): Promise<ComponentFixture<T>>
	{
		await TestBed
			.configureTestingModule({
				imports: [component, ...this.imports],
				providers: [
					provideZonelessChangeDetection(),
					provideNoopAnimations(),
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
	 * @param token - Service class or injection token
	 * @returns Service instance
	 */
	getService<S>(token: Type<S>): S
	{
		return TestBed.inject(token);
	}
}

/**
 * Creates a test QueryClient with retry disabled for faster tests
 * Eliminates duplication of QueryClient configuration across 40+ test files
 * Follows DRY principle
 *
 * @returns QueryClient configured for testing
 *
 * @example
 * const queryClient = createTestQueryClient();
 * TestBed.configureTestingModule({
 *   providers: [provideTanStackQuery(queryClient)]
 * });
 */
export function createTestQueryClient(): QueryClient
{
	return new QueryClient({
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
 * @param service - Service class to test
 * @param providers - Additional providers (e.g., mocked dependencies)
 * @returns Object containing service instance and QueryClient
 *
 * @example
 * describe("UserService", () => {
 *   let service: UserService;
 *   let mockRepository: jasmine.SpyObj<UserRepository>;
 *
 *   beforeEach(() => {
 *     mockRepository = createMockUserRepository();
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

	TestBed.configureTestingModule({
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
 * @param repository - Repository class to test
 * @param providers - Additional providers (e.g., mocked ApiService)
 * @returns Repository instance
 *
 * @example
 * describe("UserRepository", () => {
 *   let repository: UserRepository;
 *   let mockApiService: jasmine.SpyObj<ApiService>;
 *
 *   beforeEach(() => {
 *     mockApiService = jasmine.createSpyObj("ApiService", ["get", "post", "put", "delete"]);
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
	TestBed.configureTestingModule({
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
 * @param service - Service class to test
 * @param providers - Additional providers (e.g., mocked dependencies)
 * @param imports - Optional imports (e.g., HttpClientTestingModule)
 * @returns Service instance
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
	TestBed.configureTestingModule({
		imports,
		providers: [provideZonelessChangeDetection(), service, ...providers]
	});

	return TestBed.inject(service);
}
