import { describe, expect, it } from "vitest";
import { orders, productVariants } from "../schema/index";

describe("schema expansion columns",
	() =>
	{
		describe("orders table",
			() =>
			{
				it("has fulfillmentChannel column",
					() =>
					{
						expect(orders.fulfillmentChannel)
							.toBeDefined();
						expect(orders.fulfillmentChannel.name)
							.toBe("fulfillment_channel");
					});

				it("has shippingProvider column",
					() =>
					{
						expect(orders.shippingProvider)
							.toBeDefined();
						expect(orders.shippingProvider.name)
							.toBe("shipping_provider");
					});

				it("has trackingUrl column",
					() =>
					{
						expect(orders.trackingUrl)
							.toBeDefined();
						expect(orders.trackingUrl.name)
							.toBe("tracking_url");
					});
			});

		describe("productVariants table",
			() =>
			{
				it("has stockLevel column",
					() =>
					{
						expect(productVariants.stockLevel)
							.toBeDefined();
						expect(productVariants.stockLevel.name)
							.toBe("stock_level");
					});

				it("has lowStockThreshold column",
					() =>
					{
						expect(productVariants.lowStockThreshold)
							.toBeDefined();
						expect(productVariants.lowStockThreshold.name)
							.toBe("low_stock_threshold");
					});
			});
	});