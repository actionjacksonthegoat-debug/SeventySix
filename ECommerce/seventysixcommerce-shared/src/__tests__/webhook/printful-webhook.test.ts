import { describe, expect, it, vi } from "vitest";
import {
	handlePrintfulShipmentUpdate,
	type ShippingEmailClient
} from "../../webhook/printful";
import type { PrintfulWebhookBody } from "../../webhook/types";

/**
 * Creates a mock CommerceDb that returns the given orders
 * from the select chain and records update/insert calls.
 */
function createMockDb(matchedOrders: { id: string; email: string; status: string; }[]): {
	/** The mock database object. */
	db: ReturnType<typeof createChainedMock>;
	/** Tracks calls to update().set().where(). */
	updateCalls: unknown[];
	/** Tracks calls to insert().values(). */
	insertCalls: unknown[];
}
{
	const updateCalls: unknown[] = [];
	const insertCalls: unknown[] = [];

	/** Creates the chainable mock object used as CommerceDb. */
	function createChainedMock(): {
		select: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		insert: ReturnType<typeof vi.fn>;
	}
	{
		return {
			select: vi
				.fn()
				.mockReturnValue(
					{
						from: vi
							.fn()
							.mockReturnValue(
								{
									where: vi
										.fn()
										.mockReturnValue(
											{
												limit: vi
													.fn()
													.mockResolvedValue(matchedOrders)
											})
								})
					}),
			update: vi
				.fn()
				.mockReturnValue(
					{
						set: vi
							.fn()
							.mockImplementation(
								(data: unknown) =>
								{
									updateCalls.push(data);
									return {
										where: vi
											.fn()
											.mockResolvedValue(undefined)
									};
								})
					}),
			insert: vi
				.fn()
				.mockReturnValue(
					{
						values: vi
							.fn()
							.mockImplementation(
								(data: unknown) =>
								{
									insertCalls.push(data);
									return Promise.resolve(undefined);
								})
					})
		};
	}

	const db: ReturnType<typeof createChainedMock> =
		createChainedMock();

	return { db, updateCalls, insertCalls };
}

describe("handlePrintfulShipmentUpdate",
	() =>
	{
		it("updates order status and sends email for valid shipment",
			async () =>
			{
				const { db, updateCalls, insertCalls } =
					createMockDb(
						[{ id: "order-1", email: "user@test.local", status: "pending" }]);

				const emailClient: ShippingEmailClient =
					vi
						.fn()
						.mockResolvedValue(undefined);

				const body: PrintfulWebhookBody =
					{
						type: "package_shipped",
						data: {
							order: { id: 12345 },
							shipment: { tracking_number: "TRACK123", carrier: "usps" }
						}
					};

				const result: { received: boolean; } =
					await handlePrintfulShipmentUpdate(
						db as never,
						body,
						emailClient);

				expect(result)
					.toEqual(
						{ received: true });
				expect(updateCalls)
					.toHaveLength(1);
				expect(updateCalls[0])
					.toMatchObject(
						{
							status: "shipped",
							fulfillmentChannel: "printful",
							shippingProvider: "usps"
						});
				expect(insertCalls)
					.toHaveLength(1);
				expect(insertCalls[0])
					.toMatchObject(
						{
							orderId: "order-1",
							fromStatus: "pending",
							toStatus: "shipped"
						});
				expect(emailClient)
					.toHaveBeenCalledWith(
						"user@test.local",
						"order-1",
						"TRACK123",
						"usps");
			});

		it("returns received true for unknown order (no match)",
			async () =>
			{
				const { db, updateCalls, insertCalls } =
					createMockDb([]);

				const emailClient: ShippingEmailClient =
					vi
						.fn()
						.mockResolvedValue(undefined);

				const body: PrintfulWebhookBody =
					{
						type: "package_shipped",
						data: {
							order: { id: 99999 },
							shipment: { tracking_number: "TRACK999", carrier: "FedEx" }
						}
					};

				const result: { received: boolean; } =
					await handlePrintfulShipmentUpdate(
						db as never,
						body,
						emailClient);

				expect(result)
					.toEqual(
						{ received: true });
				expect(updateCalls)
					.toHaveLength(0);
				expect(insertCalls)
					.toHaveLength(0);
				expect(emailClient).not.toHaveBeenCalled();
			});

		it("handles missing tracking number gracefully",
			async () =>
			{
				const { db, updateCalls } =
					createMockDb(
						[{ id: "order-2", email: "user2@test.local", status: "pending" }]);

				const body: PrintfulWebhookBody =
					{
						type: "package_shipped",
						data: {
							order: { id: 555 },
							shipment: {}
						}
					};

				const result: { received: boolean; } =
					await handlePrintfulShipmentUpdate(
						db as never,
						body,
						null);

				expect(result)
					.toEqual(
						{ received: true });
				expect(updateCalls)
					.toHaveLength(1);
				expect(updateCalls[0])
					.toMatchObject(
						{ status: "shipped" });
			});

		it("skips processing for non-shipment event types",
			async () =>
			{
				const { db, updateCalls } =
					createMockDb([]);

				const body: PrintfulWebhookBody =
					{
						type: "order_created",
						data: {
							order: { id: 12345 }
						}
					};

				const result: { received: boolean; } =
					await handlePrintfulShipmentUpdate(
						db as never,
						body,
						null);

				expect(result)
					.toEqual(
						{ received: true });
				expect(updateCalls)
					.toHaveLength(0);
			});

		it("handles null emailClient without throwing",
			async () =>
			{
				const { db } =
					createMockDb(
						[{ id: "order-3", email: "user3@test.local", status: "processing" }]);

				const body: PrintfulWebhookBody =
					{
						type: "package_shipped",
						data: {
							order: { id: 777 },
							shipment: { tracking_number: "SHIP777", carrier: "DHL" }
						}
					};

				const result: { received: boolean; } =
					await handlePrintfulShipmentUpdate(
						db as never,
						body,
						null);

				expect(result)
					.toEqual(
						{ received: true });
			});
	});