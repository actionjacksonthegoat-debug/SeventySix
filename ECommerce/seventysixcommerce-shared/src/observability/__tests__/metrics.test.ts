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

describe("createCommerceMetrics",
	() =>
	{
		afterEach(
			() =>
			{
				vi.clearAllMocks();
			});

		it("creates a meter with the given name",
			async () =>
			{
				const { createCommerceMetrics } =
					await import("../metrics");

				createCommerceMetrics("test-meter");

				expect(mockGetMeter)
					.toHaveBeenCalledWith("test-meter");
			});

		it("records page view with page type attribute",
			async () =>
			{
				const { createCommerceMetrics } =
					await import("../metrics");

				const m =
					createCommerceMetrics("test-meter");

				m.recordPageView("home");

				expect(mockCounterAdd)
					.toHaveBeenCalledWith(
						1,
						{ "page.type": "home" });
			});

		it("records cart add with product slug attribute",
			async () =>
			{
				const { createCommerceMetrics } =
					await import("../metrics");

				const m =
					createCommerceMetrics("test-meter");

				m.recordCartAdd("test-product");

				expect(mockCounterAdd)
					.toHaveBeenCalledWith(
						1,
						{ "product.slug": "test-product" });
			});

		it("records cart remove with product slug attribute",
			async () =>
			{
				const { createCommerceMetrics } =
					await import("../metrics");

				const m =
					createCommerceMetrics("test-meter");

				m.recordCartRemove("test-product");

				expect(mockCounterAdd)
					.toHaveBeenCalledWith(
						1,
						{ "product.slug": "test-product" });
			});

		it("records checkout start",
			async () =>
			{
				const { createCommerceMetrics } =
					await import("../metrics");

				const m =
					createCommerceMetrics("test-meter");

				m.recordCheckoutStart();

				expect(mockCounterAdd)
					.toHaveBeenCalledWith(1);
			});

		it("records checkout complete with duration histogram",
			async () =>
			{
				const { createCommerceMetrics } =
					await import("../metrics");

				const m =
					createCommerceMetrics("test-meter");

				m.recordCheckoutComplete(1500);

				expect(mockCounterAdd)
					.toHaveBeenCalledWith(1);
				expect(mockHistogramRecord)
					.toHaveBeenCalledWith(
						1500,
						{ "checkout.status": "complete" });
			});
	});