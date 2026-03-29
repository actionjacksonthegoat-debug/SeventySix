import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Ga4Item } from "../ecommerce-events";

type EcommerceModule = typeof import("../ecommerce-events");

interface GtagCall
{
	event: string;
	params: Record<string, unknown>;
}

/** Installs a mock gtag that records all calls. */
function installMockGtag(): { getCalls: () => GtagCall[]; }
{
	const calls: GtagCall[] = [];

	vi.stubGlobal("window",
		{
			...window,
			gtag: (...args: unknown[]): void =>
			{
				if (args[0] === "event")
				{
					calls.push(
						{
							event: args[1] as string,
							params: args[2] as Record<string, unknown>
						});
				}
			}
		});

	return { getCalls: (): GtagCall[] => calls };
}

describe("ecommerce-events",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.resetModules();
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		describe("when analytics is active",
			() =>
			{
				let ecommerce: EcommerceModule;
				let getCalls: () => GtagCall[];

				beforeEach(
					async () =>
					{
						vi.doMock("../analytics", () => ({
							isAnalyticsActive: (): boolean => true
						}));

						ecommerce =
							await import("../ecommerce-events");

						const mock: { getCalls: () => GtagCall[]; } =
							installMockGtag();

						getCalls =
							mock.getCalls;
					});

				it("trackViewItemList sends view_item_list event",
					() =>
					{
						const testItem: Ga4Item =
							{ item_id: "SKU-1", item_name: "Test Item" };

						ecommerce.trackViewItemList(
							"test-list",
							[
								testItem
							]);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("view_item_list");
						expect(calls[0].params["item_list_name"])
							.toBe("test-list");
					});

				it("trackSelectItem sends select_item event",
					() =>
					{
						const testItem: Ga4Item =
							{ item_id: "SKU-1", item_name: "Test Item" };

						ecommerce.trackSelectItem(
							"test-list",
							testItem);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("select_item");
					});

				it("trackViewItem sends view_item event",
					() =>
					{
						const testItem: Ga4Item =
							{ item_id: "SKU-1", item_name: "Test Item", price: 29.99 };

						ecommerce.trackViewItem(testItem);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("view_item");
					});

				it("trackAddToCart sends add_to_cart event",
					() =>
					{
						const testItem: Ga4Item =
							{ item_id: "SKU-1", item_name: "Test Item" };

						ecommerce.trackAddToCart(
							testItem,
							29.99);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("add_to_cart");
					});

				it("trackRemoveFromCart sends remove_from_cart event",
					() =>
					{
						const testItem: Ga4Item =
							{ item_id: "SKU-1", item_name: "Test Item" };

						ecommerce.trackRemoveFromCart(
							testItem,
							29.99);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("remove_from_cart");
					});

				it("trackBeginCheckout sends begin_checkout event",
					() =>
					{
						ecommerce.trackBeginCheckout(
							[],
							99.99);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("begin_checkout");
					});

				it("trackPurchase sends purchase event with transaction data",
					() =>
					{
						ecommerce.trackPurchase(
							"TXN-001",
							99.99,
							[]);

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("purchase");
						expect(calls[0].params["transaction_id"])
							.toBe("TXN-001");
					});

				it("trackSearch sends search event",
					() =>
					{
						ecommerce.trackSearch("blue widget");

						const calls: GtagCall[] =
							getCalls();

						expect(calls)
							.toHaveLength(1);
						expect(calls[0].event)
							.toBe("search");
						expect(calls[0].params["search_term"])
							.toBe("blue widget");
					});
			});

		describe("when analytics is not active",
			() =>
			{
				let ecommerce: EcommerceModule;

				beforeEach(
					async () =>
					{
						vi.doMock("../analytics", () => ({
							isAnalyticsActive: (): boolean => false
						}));

						ecommerce =
							await import("../ecommerce-events");
					});

				it("trackViewItemList does nothing",
					() =>
					{
						const { getCalls }: { getCalls: () => GtagCall[]; } =
							installMockGtag();

						ecommerce.trackViewItemList(
							"test",
							[]);

						expect(getCalls())
							.toHaveLength(0);
					});

				it("trackAddToCart does nothing",
					() =>
					{
						const { getCalls }: { getCalls: () => GtagCall[]; } =
							installMockGtag();

						const testItem: Ga4Item =
							{ item_id: "SKU-1", item_name: "Test" };

						ecommerce.trackAddToCart(
							testItem,
							10);

						expect(getCalls())
							.toHaveLength(0);
					});

				it("trackPurchase does nothing",
					() =>
					{
						const { getCalls }: { getCalls: () => GtagCall[]; } =
							installMockGtag();

						ecommerce.trackPurchase(
							"TXN-001",
							50,
							[]);

						expect(getCalls())
							.toHaveLength(0);
					});
			});
	});