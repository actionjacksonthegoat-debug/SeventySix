import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createPrintfulClient,
	PRINTFUL_STATUS_MAP,
	type PrintfulClient
} from "../printful";

const mockFetch: ReturnType<typeof vi.fn> =
	vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("createPrintfulClient",
	() =>
	{
		let client: PrintfulClient;

		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		describe("mock mode",
			() =>
			{
				beforeEach(
					() =>
					{
						client =
							createPrintfulClient(
								{
									apiKey: "test-key",
									mockServices: true
								});
					});

				it("returns simulated order in mock mode",
					async () =>
					{
						const warnSpy: ReturnType<typeof vi.spyOn> =
							vi
								.spyOn(console, "warn");
						const result =
							await client.createPrintfulOrder(
								{
									shippingName: "Test User",
									shippingAddress: { country: "US" },
									items: [{ printfulSyncVariantId: "pf-1", quantity: 1 }]
								});

						expect(result.status)
							.toBe("draft");
						expect(result.id)
							.toBeGreaterThan(0);
						expect(mockFetch).not.toHaveBeenCalled();
						expect(warnSpy)
							.toHaveBeenCalledWith(
								expect.stringContaining("[Printful Mock]"));
					});
			});

		describe("live mode",
			() =>
			{
				beforeEach(
					() =>
					{
						client =
							createPrintfulClient(
								{
									apiKey: "test-printful-key",
									mockServices: false
								});
					});

				it("submits order with correct line items",
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

						const result =
							await client.createPrintfulOrder(
								{
									shippingName: "Test User",
									shippingAddress: {
										line1: "123 Main St",
										city: "Portland",
										state: "OR",
										postal_code: "97201",
										country: "US"
									},
									items: [{ printfulSyncVariantId: "pf-123", quantity: 2 }]
								});

						expect(result)
							.toEqual(
								{ id: 12345, status: "draft" });
						expect(mockFetch)
							.toHaveBeenCalledWith(
								"https://api.printful.com/orders",
								expect.objectContaining(
									{
										method: "POST",
										headers: expect.objectContaining(
											{
												Authorization: "Bearer test-printful-key"
											})
									}));
					});

				it("includes correct recipient address",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 1, status: "draft" }
										})
							});

						await client.createPrintfulOrder(
							{
								shippingName: "Jane Doe",
								shippingAddress: {
									line1: "789 Pine Blvd",
									city: "Seattle",
									state: "WA",
									postal_code: "98101",
									country: "US"
								},
								items: [{ printfulSyncVariantId: "pf-1", quantity: 1 }]
							});

						const callBody: Record<string, unknown> =
							JSON.parse(
								mockFetch.mock.calls[0][1].body as string);
						expect(callBody.recipient)
							.toEqual(
								{
									name: "Jane Doe",
									address1: "789 Pine Blvd",
									city: "Seattle",
									state_code: "WA",
									country_code: "US",
									zip: "98101"
								});
					});

				it("uses DEFAULT_COUNTRY when country is undefined",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 1, status: "draft" }
										})
							});

						await client.createPrintfulOrder(
							{
								shippingName: "Test",
								shippingAddress: {},
								items: [{ printfulSyncVariantId: "pf-1", quantity: 1 }]
							});

						const callBody: Record<string, unknown> =
							JSON.parse(
								mockFetch.mock.calls[0][1].body as string);
						const recipient =
							callBody.recipient as Record<string, string>;
						expect(recipient.country_code)
							.toBe("US");
					});

				it("throws when API returns error",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: false,
								status: 500
							});
						vi
							.spyOn(console, "error")
							.mockImplementation(() => undefined);

						await expect(
							client.createPrintfulOrder(
								{
									shippingName: "Test",
									shippingAddress: {},
									items: [{ printfulSyncVariantId: "pf-1", quantity: 1 }]
								}))
							.rejects
							.toThrow("Printful API error (500)");
					});

				it("throws when no items have Printful variant IDs",
					async () =>
					{
						await expect(
							client.createPrintfulOrder(
								{
									shippingName: "Test",
									shippingAddress: {},
									items: [{ printfulSyncVariantId: null, quantity: 1 }]
								}))
							.rejects
							.toThrow("No fulfillable items");
						expect(mockFetch).not.toHaveBeenCalled();
					});

				it("filters out items without printfulSyncVariantId",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 1, status: "draft" }
										})
							});

						await client.createPrintfulOrder(
							{
								shippingName: "Test",
								shippingAddress: {},
								items: [
									{ printfulSyncVariantId: "pf-abc", quantity: 1 },
									{ printfulSyncVariantId: null, quantity: 2 },
									{ printfulSyncVariantId: "pf-def", quantity: 3 }
								]
							});

						const callBody: Record<string, unknown> =
							JSON.parse(
								mockFetch.mock.calls[0][1].body as string);
						expect(callBody.items)
							.toEqual(
								[
									{ sync_variant_id: "pf-abc", quantity: 1 },
									{ sync_variant_id: "pf-def", quantity: 3 }
								]);
					});
			});

		describe("getPrintfulOrderStatus",
			() =>
			{
				beforeEach(
					() =>
					{
						client =
							createPrintfulClient(
								{
									apiKey: "test-key",
									mockServices: false
								});
					});

				it("returns mapped status for known Printful status",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 123, status: "fulfilled" }
										})
							});

						const status: string =
							await client.getPrintfulOrderStatus("123");

						expect(status)
							.toBe("shipped");
						expect(mockFetch)
							.toHaveBeenCalledWith(
								"https://api.printful.com/orders/123",
								expect.objectContaining(
									{
										headers: { Authorization: "Bearer test-key" }
									}));
					});

				it("returns 'fulfilling' for unknown Printful status",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 123, status: "unknown_status" }
										})
							});

						const status: string =
							await client.getPrintfulOrderStatus("123");

						expect(status)
							.toBe("fulfilling");
					});

				it("throws on API error",
					async () =>
					{
						mockFetch.mockResolvedValue(
							{ ok: false, status: 404 });

						await expect(
							client.getPrintfulOrderStatus("999"))
							.rejects
							.toThrow("Printful API error (404)");
					});
			});

		describe("PRINTFUL_STATUS_MAP",
			() =>
			{
				it("maps all expected statuses",
					() =>
					{
						expect(PRINTFUL_STATUS_MAP["draft"])
							.toBe("fulfilling");
						expect(PRINTFUL_STATUS_MAP["pending"])
							.toBe("fulfilling");
						expect(PRINTFUL_STATUS_MAP["failed"])
							.toBe("fulfillment_error");
						expect(PRINTFUL_STATUS_MAP["canceled"])
							.toBe("cancelled");
						expect(PRINTFUL_STATUS_MAP["fulfilled"])
							.toBe("shipped");
					});
			});
	});