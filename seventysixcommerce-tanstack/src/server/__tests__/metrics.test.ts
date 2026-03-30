import { afterEach, describe, expect, it, vi } from "vitest";

const mockCounterAdd =
	vi.fn();
const mockHistogramRecord =
	vi.fn();
const mockCreateCounter =
	vi
		.fn()
		.mockReturnValue(
			{ add: mockCounterAdd });
const mockCreateHistogram =
	vi
		.fn()
		.mockReturnValue(
			{ record: mockHistogramRecord });
const mockGetMeter =
	vi
		.fn()
		.mockReturnValue(
			{
				createCounter: mockCreateCounter,
				createHistogram: mockCreateHistogram
			});

vi.mock("@opentelemetry/api", () => (
	{
		metrics: {
			getMeter: mockGetMeter
		}
	}));

describe("metrics",
	() =>
	{
		afterEach(
			() =>
			{
				vi.restoreAllMocks();
				vi.resetModules();
			});

		it("should export recordPageView function",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				expect(metricsModule.recordPageView)
					.toBeDefined();
				expect(typeof metricsModule.recordPageView)
					.toBe("function");
			});

		it("should export recordCartAdd function",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				expect(metricsModule.recordCartAdd)
					.toBeDefined();
				expect(typeof metricsModule.recordCartAdd)
					.toBe("function");
			});

		it("should export recordCheckoutStart function",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				expect(metricsModule.recordCheckoutStart)
					.toBeDefined();
			});

		it("should export recordCheckoutComplete function",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				expect(metricsModule.recordCheckoutComplete)
					.toBeDefined();
			});

		it("should increment page view counter with page type",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				metricsModule.recordPageView("home");
				expect(mockCounterAdd)
					.toHaveBeenCalledWith(
						1,
						{ "page.type": "home" });
			});

		it("should increment cart add counter with product slug",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				metricsModule.recordCartAdd("test-product");
				expect(mockCounterAdd)
					.toHaveBeenCalledWith(
						1,
						{ "product.slug": "test-product" });
			});

		it("should record checkout duration in histogram",
			async () =>
			{
				const metricsModule =
					await import("~/server/metrics");
				metricsModule.recordCheckoutComplete(1500);
				expect(mockHistogramRecord)
					.toHaveBeenCalledWith(
						1500,
						expect.any(Object));
			});
	});