import { afterEach, describe, expect, it, vi } from "vitest";

// Mock browser globals
const mockSpanEnd =
	vi.fn();
const mockStartSpan =
	vi
		.fn()
		.mockReturnValue(
			{ end: mockSpanEnd });
const mockGetTracer =
	vi
		.fn()
		.mockReturnValue(
			{ startSpan: mockStartSpan });
const mockRegister =
	vi.fn();

vi.mock("@opentelemetry/sdk-trace-web", () => (
	{
		WebTracerProvider: class MockWebTracerProvider
		{
			register = mockRegister;
		},
		BatchSpanProcessor: class MockBatchSpanProcessor
		{
		}
	}));

vi.mock("@opentelemetry/exporter-trace-otlp-http", () => (
	{
		OTLPTraceExporter: class MockOtlpExporter
		{
		}
	}));

vi.mock("@opentelemetry/resources", () => (
	{
		resourceFromAttributes: vi
			.fn()
			.mockReturnValue({})
	}));

vi.mock("@opentelemetry/api", () => (
	{
		trace: {
			getTracer: mockGetTracer
		}
	}));

// Stub PerformanceObserver to avoid errors in Node test environment
vi.stubGlobal("PerformanceObserver", undefined);

describe("telemetry-client",
	() =>
	{
		afterEach(
			() =>
			{
				vi.clearAllMocks();
				vi.resetModules();
			});

		it("should export initClientTelemetry function",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				expect(mod.initClientTelemetry)
					.toBeDefined();
				expect(typeof mod.initClientTelemetry)
					.toBe("function");
			});

		it("should not initialize when endpoint is empty",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.initClientTelemetry("");
				expect(mockRegister)
					.not
					.toHaveBeenCalled();
			});

		it("should initialize provider when endpoint is provided",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.initClientTelemetry("http://localhost:4318");
				expect(mockRegister)
					.toHaveBeenCalled();
				expect(mockGetTracer)
					.toHaveBeenCalledWith("seventysixcommerce-sveltekit-browser");
			});

		it("should not double-initialize on subsequent calls",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.initClientTelemetry("http://localhost:4318");
				mod.initClientTelemetry("http://localhost:4318");
				expect(mockRegister)
					.toHaveBeenCalledTimes(1);
			});

		it("should record navigation span when initialized",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.initClientTelemetry("http://localhost:4318");
				mod.recordNavigation("/shop/prints");
				expect(mockStartSpan)
					.toHaveBeenCalledWith("page.navigation",
						{ attributes: { "page.path": "/shop/prints" } });
				expect(mockSpanEnd)
					.toHaveBeenCalled();
			});

		it("should not record navigation when not initialized",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.recordNavigation("/shop");
				expect(mockStartSpan)
					.not
					.toHaveBeenCalled();
			});

		it("should record commerce event span when initialized",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.initClientTelemetry("http://localhost:4318");
				mod.recordCommerceEvent("product.view",
					{ "product.slug": "sunset-poster" });
				expect(mockStartSpan)
					.toHaveBeenCalledWith("commerce.product.view",
						{ attributes: { "product.slug": "sunset-poster" } });
			});

		it("should not record commerce event when not initialized",
			async () =>
			{
				const mod =
					await import("$lib/telemetry-client");
				mod.recordCommerceEvent("cart.add",
					{ "product.slug": "test" });
				expect(mockStartSpan)
					.not
					.toHaveBeenCalled();
			});
	});