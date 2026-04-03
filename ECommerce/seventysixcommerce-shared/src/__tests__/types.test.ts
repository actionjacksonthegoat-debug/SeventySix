import { describe, expect, it } from "vitest";
import type {
	OrderForFulfillment,
	PrintfulOrderResult,
	ShippingAddress
} from "../types/index";

describe("shared types",
	() =>
	{
		it("PrintfulOrderResult should have id and status",
			() =>
			{
				const result: PrintfulOrderResult =
					{ id: 123, status: "fulfilled" };
				expect(result.id)
					.toBe(123);
				expect(result.status)
					.toBe("fulfilled");
			});

		it("ShippingAddress should accept optional fields",
			() =>
			{
				const empty: ShippingAddress = {};
				expect(empty.line1)
					.toBeUndefined();

				const full: ShippingAddress =
					{
						line1: "123 Main St",
						city: "Anytown",
						state: "PA",
						postal_code: "19101",
						country: "US"
					};
				expect(full.city)
					.toBe("Anytown");
			});

		it("OrderForFulfillment should have required fields",
			() =>
			{
				const order: OrderForFulfillment =
					{
						shippingName: "John Doe",
						shippingAddress: { country: "US" },
						items: [
							{
								printfulSyncVariantId: "sync_123",
								quantity: 2
							}
						]
					};
				expect(order.shippingName)
					.toBe("John Doe");
				expect(order.items)
					.toHaveLength(1);
			});

		it("OrderForFulfillment items should allow null printfulSyncVariantId",
			() =>
			{
				const order: OrderForFulfillment =
					{
						shippingName: "Jane Doe",
						shippingAddress: {},
						items: [
							{
								printfulSyncVariantId: null,
								quantity: 1
							}
						]
					};
				expect(order.items[0]!.printfulSyncVariantId)
					.toBeNull();
			});
	});