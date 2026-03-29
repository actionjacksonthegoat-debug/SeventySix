import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("$env/dynamic/private", () => ({
	env: { MOCK_SERVICES: "false", PRINTFUL_API_KEY: "test_printful_key" }
}));

describe("Printful Service",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				vi.restoreAllMocks();
			});

		it("submits order with correct line items",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 12345, status: "draft" }
										})
							});
				vi.stubGlobal("fetch", mockFetch);

				const { createPrintfulOrder } =
					await import("../integrations/printful");
				const result =
					await createPrintfulOrder(
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
										Authorization: "Bearer test_printful_key"
									})
							}));
			});

		it("maps internal variant IDs to Printful variant IDs",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 99, status: "draft" }
										})
							});
				vi.stubGlobal("fetch", mockFetch);

				const { createPrintfulOrder } =
					await import("../integrations/printful");
				await createPrintfulOrder(
					{
						shippingName: "Test",
						shippingAddress: { line1: "456 Oak Ave" },
						items: [
							{ printfulSyncVariantId: "pf-abc", quantity: 1 },
							{ printfulSyncVariantId: "pf-def", quantity: 3 }
						]
					});

				const callBody =
					JSON.parse(mockFetch.mock.calls[0][1].body);
				expect(callBody.items)
					.toEqual(
						[
							{ sync_variant_id: "pf-abc", quantity: 1 },
							{ sync_variant_id: "pf-def", quantity: 3 }
						]);
			});

		it("includes shipping address from Stripe session",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{
								ok: true,
								json: () =>
									Promise.resolve(
										{
											code: 200,
											result: { id: 1, status: "draft" }
										})
							});
				vi.stubGlobal("fetch", mockFetch);

				const { createPrintfulOrder } =
					await import("../integrations/printful");
				await createPrintfulOrder(
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

				const callBody =
					JSON.parse(mockFetch.mock.calls[0][1].body);
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

		it("handles Printful API error gracefully",
			async () =>
			{
				const mockFetch =
					vi
						.fn()
						.mockResolvedValue(
							{
								ok: false,
								status: 500,
								text: () =>
									Promise.resolve("Internal server error")
							});
				vi.stubGlobal("fetch", mockFetch);

				const { createPrintfulOrder } =
					await import("../integrations/printful");
				await expect(
					createPrintfulOrder(
						{
							shippingName: "Test",
							shippingAddress: {},
							items: [{ printfulSyncVariantId: "pf-1", quantity: 1 }]
						}))
					.rejects
					.toThrow("Printful API error (500)");
			});

		it("does not submit when no items have Printful variant IDs",
			async () =>
			{
				const mockFetch =
					vi.fn();
				vi.stubGlobal("fetch", mockFetch);

				const { createPrintfulOrder } =
					await import("../integrations/printful");
				await expect(
					createPrintfulOrder(
						{
							shippingName: "Test",
							shippingAddress: {},
							items: [{ printfulSyncVariantId: null, quantity: 1 }]
						}))
					.rejects
					.toThrow("No fulfillable items");
				expect(mockFetch).not.toHaveBeenCalled();
			});
	});