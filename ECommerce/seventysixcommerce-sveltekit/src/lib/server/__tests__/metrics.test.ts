import { afterEach, describe, expect, it, vi } from "vitest";

const mockRecordPageView =
	vi.fn();
const mockRecordCartAdd =
	vi.fn();
const mockRecordCartRemove =
	vi.fn();
const mockRecordCheckoutStart =
	vi.fn();
const mockRecordCheckoutComplete =
	vi.fn();

vi.mock("@seventysixcommerce/shared/observability", () => (
	{
		createCommerceMetrics: vi
			.fn()
			.mockReturnValue(
				{
					recordPageView: mockRecordPageView,
					recordCartAdd: mockRecordCartAdd,
					recordCartRemove: mockRecordCartRemove,
					recordCheckoutStart: mockRecordCheckoutStart,
					recordCheckoutComplete: mockRecordCheckoutComplete
				})
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
					await import("$lib/server/metrics");
				expect(metricsModule.recordPageView)
					.toBeDefined();
				expect(typeof metricsModule.recordPageView)
					.toBe("function");
			});

		it("should export recordCartAdd function",
			async () =>
			{
				const metricsModule =
					await import("$lib/server/metrics");
				expect(metricsModule.recordCartAdd)
					.toBeDefined();
				expect(typeof metricsModule.recordCartAdd)
					.toBe("function");
			});

		it("should export recordCheckoutStart function",
			async () =>
			{
				const metricsModule =
					await import("$lib/server/metrics");
				expect(metricsModule.recordCheckoutStart)
					.toBeDefined();
			});

		it("should export recordCheckoutComplete function",
			async () =>
			{
				const metricsModule =
					await import("$lib/server/metrics");
				expect(metricsModule.recordCheckoutComplete)
					.toBeDefined();
			});

		it("should increment page view counter with page type",
			async () =>
			{
				const metricsModule =
					await import("$lib/server/metrics");
				metricsModule.recordPageView("home");
				expect(mockRecordPageView)
					.toHaveBeenCalledWith("home");
			});

		it("should increment cart add counter with product slug",
			async () =>
			{
				const metricsModule =
					await import("$lib/server/metrics");
				metricsModule.recordCartAdd("test-product");
				expect(mockRecordCartAdd)
					.toHaveBeenCalledWith("test-product");
			});

		it("should record checkout duration in histogram",
			async () =>
			{
				const metricsModule =
					await import("$lib/server/metrics");
				metricsModule.recordCheckoutComplete(1500);
				expect(mockRecordCheckoutComplete)
					.toHaveBeenCalledWith(1500);
			});
	});