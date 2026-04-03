import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Ga4Item } from "../ecommerce-events";

let eventsModule: typeof import("../ecommerce-events");

describe("ecommerce-events",
	() =>
	{
		const testItem: Ga4Item =
			{
				item_id: "prod-1",
				item_name: "Test Shirt",
				item_category: "T-Shirts",
				price: 29.99,
				quantity: 1
			};

		let gtagCalls: unknown[][];

		beforeEach(
			async () =>
			{
				gtagCalls = [];
				vi.resetModules();

				vi.stubGlobal("window",
					{
						gtag(...args: unknown[]): void
						{
							gtagCalls.push(args);
						}
					});
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		describe("when analytics is active",
			() =>
			{
				beforeEach(
					async () =>
					{
						vi.doMock("../analytics", () => ({ isAnalyticsActive: (): boolean => true }));

						eventsModule =
							await import("../ecommerce-events");
					});

				it("trackViewItemList sends view_item_list event",
					() =>
					{
						eventsModule.trackViewItemList(
							"T-Shirts",
							[testItem]);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][0])
							.toBe("event");
						expect(gtagCalls[0][1])
							.toBe("view_item_list");
					});

				it("trackSelectItem sends select_item event",
					() =>
					{
						eventsModule.trackSelectItem("T-Shirts", testItem);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("select_item");
					});

				it("trackViewItem sends view_item event",
					() =>
					{
						eventsModule.trackViewItem(testItem);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("view_item");
					});

				it("trackAddToCart sends add_to_cart event with currency",
					() =>
					{
						eventsModule.trackAddToCart(testItem, 29.99);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("add_to_cart");

						const params: Record<string, unknown> =
							gtagCalls[0][2] as Record<string, unknown>;

						expect(params["currency"])
							.toBe("USD");
						expect(params["value"])
							.toBe(29.99);
					});

				it("trackRemoveFromCart sends remove_from_cart event",
					() =>
					{
						eventsModule.trackRemoveFromCart(testItem, 29.99);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("remove_from_cart");
					});

				it("trackBeginCheckout sends begin_checkout event",
					() =>
					{
						eventsModule.trackBeginCheckout(
							[testItem],
							29.99);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("begin_checkout");
					});

				it("trackPurchase sends purchase event with transactionId",
					() =>
					{
						eventsModule.trackPurchase(
							"order-123",
							29.99,
							[testItem]);

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("purchase");

						const params: Record<string, unknown> =
							gtagCalls[0][2] as Record<string, unknown>;

						expect(params["transaction_id"])
							.toBe("order-123");
					});

				it("trackSearch sends search event",
					() =>
					{
						eventsModule.trackSearch("vintage tee");

						expect(gtagCalls)
							.toHaveLength(1);
						expect(gtagCalls[0][1])
							.toBe("search");

						const params: Record<string, unknown> =
							gtagCalls[0][2] as Record<string, unknown>;

						expect(params["search_term"])
							.toBe("vintage tee");
					});
			});

		describe("when analytics is not active",
			() =>
			{
				beforeEach(
					async () =>
					{
						vi.doMock("../analytics", () => ({ isAnalyticsActive: (): boolean => false }));

						eventsModule =
							await import("../ecommerce-events");
					});

				it("trackViewItemList is a no-op",
					() =>
					{
						eventsModule.trackViewItemList(
							"T-Shirts",
							[testItem]);

						expect(gtagCalls)
							.toHaveLength(0);
					});

				it("trackAddToCart is a no-op",
					() =>
					{
						eventsModule.trackAddToCart(testItem, 29.99);

						expect(gtagCalls)
							.toHaveLength(0);
					});

				it("trackPurchase is a no-op",
					() =>
					{
						eventsModule.trackPurchase(
							"order-123",
							29.99,
							[testItem]);

						expect(gtagCalls)
							.toHaveLength(0);
					});
			});
	});