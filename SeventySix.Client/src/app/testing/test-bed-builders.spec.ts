/**
 * Test for Test Bed Builder Utilities
 * Ensures test utilities work correctly
 */

import { TestBed } from "@angular/core/testing";
import { Injectable, InjectionToken } from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";
import { createTestQueryClient, setupServiceTest } from "./test-bed-builders";

// Mock service for testing
@Injectable()
class MockTestService
{
	getValue(): string
	{
		return "test value";
	}
}

const TEST_TOKEN: InjectionToken<string> = new InjectionToken<string>(
	"TEST_TOKEN"
);

describe("Test Bed Builders", () =>
{
	afterEach(() =>
	{
		TestBed.resetTestingModule();
	});

	describe("createTestQueryClient", () =>
	{
		it("should create QueryClient with retry disabled", () =>
		{
			const queryClient: QueryClient = createTestQueryClient();

			expect(queryClient).toBeDefined();
			expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
			expect(queryClient.getDefaultOptions().mutations?.retry).toBe(
				false
			);
		});
	});

	describe("setupServiceTest", () =>
	{
		it("should setup service with default providers", () =>
		{
			const setup = setupServiceTest(MockTestService);

			expect(setup.service).toBeDefined();
			expect(setup.service).toBeInstanceOf(MockTestService);
			expect(setup.queryClient).toBeDefined();
		});

		it("should include custom providers", () =>
		{
			const mockValue: string = "custom value";
			const customProvider = {
				provide: TEST_TOKEN,
				useValue: mockValue
			};

			const setup = setupServiceTest(MockTestService, [customProvider]);
			const injectedValue: string = TestBed.inject(TEST_TOKEN);

			expect(setup.service).toBeDefined();
			expect(injectedValue).toBe(mockValue);
		});

		it("should return same QueryClient instance", () =>
		{
			const setup = setupServiceTest(MockTestService);
			const injectedClient: QueryClient = TestBed.inject(QueryClient);

			expect(setup.queryClient).toBe(injectedClient);
		});
	});
});
