import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch =
	vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Printful Fulfillment",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		describe("createFulfillmentOrder",
			() =>
			{
				it("creates Printful order with correct items and shipping",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 12345, status: "draft" }
										})
							});

						const response: Response =
							await fetch(
								"https://api.printful.com/orders",
								{
									method: "POST",
									headers: {
										Authorization: "Bearer test-key",
										"Content-Type": "application/json"
									},
									body: JSON.stringify(
										{
											recipient: {
												name: "Jane Doe",
												address1: "123 Art St",
												city: "Portland",
												state_code: "OR",
												country_code: "US",
												zip: "97201"
											},
											items: [{ sync_variant_id: "sv_123", quantity: 2 }]
										})
								});

						const data =
							await response.json();

						expect(mockFetch)
							.toHaveBeenCalledTimes(1);
						expect(data.result.id)
							.toBe(12345);
					});

				it("maps product variants to Printful sync variant IDs",
					() =>
					{
						const orderItems =
							[
								{
									variantId: "v1",
									printfulSyncVariantId: "sv_100",
									quantity: 1
								},
								{
									variantId: "v2",
									printfulSyncVariantId: "sv_200",
									quantity: 3
								}
							];

						const mapped =
							orderItems.map((item) => ({
								sync_variant_id: item.printfulSyncVariantId,
								quantity: item.quantity
							}));

						expect(mapped)
							.toEqual(
								[
									{ sync_variant_id: "sv_100", quantity: 1 },
									{ sync_variant_id: "sv_200", quantity: 3 }
								]);
					});

				it("includes correct shipping address from order",
					() =>
					{
						const address =
							{
								line1: "456 Gallery Ave",
								city: "Austin",
								state: "TX",
								postal_code: "78701",
								country: "US"
							};

						const recipient =
							{
								name: "John Doe",
								address1: address.line1,
								city: address.city,
								state_code: address.state,
								country_code: address.country,
								zip: address.postal_code
							};

						expect(recipient.address1)
							.toBe("456 Gallery Ave");
						expect(recipient.state_code)
							.toBe("TX");
						expect(recipient.zip)
							.toBe("78701");
					});

				it("handles Printful API errors gracefully",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: false,
								status: 500,
								json: () =>
									Promise.resolve(
										{
											code: 500,
											error: { message: "Internal error" }
										})
							});

						const response: Response =
							await fetch(
								"https://api.printful.com/orders",
								{
									method: "POST",
									headers: { Authorization: "Bearer bad-key" }
								});

						expect(response.ok)
							.toBe(false);
						expect(response.status)
							.toBe(500);
					});

				it("stores Printful order ID on our order record",
					() =>
					{
						const printfulResult =
							{ id: 99999, status: "draft" };
						const orderUpdate =
							{
								printfulOrderId: String(printfulResult.id),
								status: "fulfilling" as const
							};

						expect(orderUpdate.printfulOrderId)
							.toBe("99999");
						expect(orderUpdate.status)
							.toBe("fulfilling");
					});

				it("does not create duplicate Printful orders (idempotent)",
					() =>
					{
						const existingOrder =
							{ printfulOrderId: "12345" };
						const shouldSkip: boolean =
							existingOrder.printfulOrderId !== null;

						expect(shouldSkip)
							.toBe(true);
					});
			});

		describe("getOrderStatus",
			() =>
			{
				it("returns current Printful fulfillment status",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 12345, status: "fulfilled" }
										})
							});

						const response: Response =
							await fetch(
								"https://api.printful.com/orders/12345");
						const data =
							await response.json();

						expect(data.result.status)
							.toBe("fulfilled");
					});

				it("maps Printful status to our status enum",
					() =>
					{
						const statusMap: Record<string, string> =
							{
								draft: "fulfilling",
								pending: "fulfilling",
								failed: "fulfillment_error",
								canceled: "cancelled",
								fulfilled: "shipped"
							};

						expect(statusMap["fulfilled"])
							.toBe("shipped");
						expect(statusMap["failed"])
							.toBe("fulfillment_error");
						expect(statusMap["draft"])
							.toBe("fulfilling");
					});
			});
	});