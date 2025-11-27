/**
 * Test for Test Bed Builder Utilities
 * Ensures test utilities work correctly
 */

import { TestBed, ComponentFixture } from "@angular/core/testing";
import {
	Component,
	Injectable,
	InjectionToken,
	input,
	output
} from "@angular/core";
import { QueryClient } from "@tanstack/angular-query-experimental";
import {
	createTestQueryClient,
	setupServiceTest,
	ComponentTestBed
} from "./test-bed-builders";

// Mock service for testing
@Injectable()
class MockTestService
{
	getValue(): string
	{
		return "test value";
	}
}

// Mock component for testing
@Component({
	selector: "app-test-component",
	template: "<div>Test</div>",
	standalone: true
})
class TestComponent
{
	testInput = input<string>();
	testOutput = output<string>();

	emitOutput(): void
	{
		this.testOutput.emit("test output");
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

	describe("ComponentTestBed", () =>
	{
		it("should configure component inputs with withInputs", async () =>
		{
			const builder: ComponentTestBed<TestComponent> =
				new ComponentTestBed<TestComponent>();
			const fixture: ComponentFixture<TestComponent> =
				await builder.build(TestComponent);

			builder.withInputs(fixture, { testInput: "test value" });

			expect(fixture.componentInstance.testInput()).toBe("test value");
		});

		it("should spy on component outputs with withOutputSpy", async () =>
		{
			const builder: ComponentTestBed<TestComponent> =
				new ComponentTestBed<TestComponent>();
			const fixture: ComponentFixture<TestComponent> =
				await builder.build(TestComponent);

			const outputSpy: jasmine.Spy = builder.withOutputSpy(
				fixture,
				"testOutput"
			);
			fixture.componentInstance.emitOutput();

			expect(outputSpy).toHaveBeenCalledWith("test output");
		});

		it("should return builder instance from withMaterialModules", () =>
		{
			const builder: ComponentTestBed<TestComponent> =
				new ComponentTestBed<TestComponent>();
			const result: ComponentTestBed<TestComponent> =
				builder.withMaterialModules();

			expect(result).toBe(builder);
		});
	});
});
