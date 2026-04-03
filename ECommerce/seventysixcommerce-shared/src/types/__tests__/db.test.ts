import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "../db";
import type { CheckoutSnapshotItem, OrderStatus } from "../db";

describe("Database Types",
	() =>
	{
		describe("ORDER_STATUSES",
			() =>
			{
				it("contains all expected statuses",
					() =>
					{
						expect(ORDER_STATUSES)
							.toEqual(
								[
									"pending",
									"paid",
									"fulfilling",
									"shipped",
									"delivered",
									"cancelled",
									"refunded",
									"fulfillment_error"
								]);
					});

				it("has exactly 8 statuses",
					() =>
					{
						expect(ORDER_STATUSES)
							.toHaveLength(8);
					});

				it("is a readonly tuple",
					() =>
					{
						const statuses: readonly string[] = ORDER_STATUSES;
						expect(statuses)
							.toBeDefined();
					});
			});

		describe("OrderStatus type",
			() =>
			{
				it("accepts valid status values",
					() =>
					{
						const status: OrderStatus = "pending";
						expect(status)
							.toBe("pending");
					});

				it("includes all lifecycle states",
					() =>
					{
						const allStatuses: OrderStatus[] =
							[
								"pending",
								"paid",
								"fulfilling",
								"shipped",
								"delivered",
								"cancelled",
								"refunded",
								"fulfillment_error"
							];
						expect(allStatuses)
							.toHaveLength(ORDER_STATUSES.length);
					});
			});

		describe("CheckoutSnapshotItem interface",
			() =>
			{
				it("defines the expected shape",
					() =>
					{
						const item: CheckoutSnapshotItem =
							{
								productId: "prod-123",
								variantId: "var-456",
								quantity: 2,
								unitPrice: "29.99"
							};

						expect(item.productId)
							.toBe("prod-123");
						expect(item.variantId)
							.toBe("var-456");
						expect(item.quantity)
							.toBe(2);
						expect(item.unitPrice)
							.toBe("29.99");
					});
			});
	});