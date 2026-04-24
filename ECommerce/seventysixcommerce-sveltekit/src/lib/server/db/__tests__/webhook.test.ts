import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDbSelect =
	vi.fn();
const mockDbInsert =
	vi.fn();
const mockDbDelete =
	vi.fn();
const mockDbUpdate =
	vi.fn();
const mockDbTransaction =
	vi.fn();
const mockConstructEvent =
	vi.fn();

vi.mock("$lib/server/db", () => ({
	db: {
		select: mockDbSelect,
		insert: mockDbInsert,
		delete: mockDbDelete,
		update: mockDbUpdate,
		transaction: mockDbTransaction
	}
}));

vi.mock("$lib/server/db/schema", () => ({
	orders: { id: "id", stripeSessionId: "stripeSessionId" },
	orderItems: {},
	cartItems: { sessionId: "sessionId" },
	productVariants: {
		id: "id",
		printfulSyncVariantId: "printfulSyncVariantId"
	},
	orderStatusHistory: {},
	checkoutSnapshots: { stripeSessionId: "stripeSessionId", items: "items" }
}));

vi.mock("drizzle-orm", () => ({
	eq: vi.fn((a, b) => ({ column: a, value: b }))
}));

vi.mock("$env/dynamic/private", () => ({
	env: { STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: "whsec_test_fake" }
}));

vi.mock("$lib/server/integrations/printful", () => ({
	createPrintfulOrder: vi
		.fn()
		.mockResolvedValue(
			{ id: "printful-123" })
}));

vi.mock("$lib/server/integrations/brevo", () => ({
	sendOrderConfirmation: vi
		.fn()
		.mockResolvedValue(undefined)
}));

vi.mock("@seventysixcommerce/shared/stripe", () => ({
	getStripe: () => ({
		webhooks: {
			constructEvent: mockConstructEvent
		}
	})
}));

vi.mock("@seventysixcommerce/shared/webhook",
	async (importActual) =>
	{
		const actual: typeof import("@seventysixcommerce/shared/webhook") =
			await importActual<
		typeof import("@seventysixcommerce/shared/webhook")>();

		return { ...actual };
	});

describe("Stripe Webhook",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				vi.resetModules();
			});

		it("verifies webhook signature",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "payment_intent.created",
						data: { object: {} }
					});

				const { POST } =
					await import("../../../../routes/api/webhook/stripe/+server");

				const request: Request =
					new Request(
						"http://localhost/api/webhook/stripe",
						{
							method: "POST",
							body: "{}",
							headers: { "stripe-signature": "sig_valid" }
						});

				const response: Response =
					await POST({ request } as never);
				expect(response.status)
					.toBe(200);
				expect(mockConstructEvent)
					.toHaveBeenCalledWith(
						"{}",
						"sig_valid",
						"whsec_test_fake");
			});

		it("rejects invalid signature with 400",
			async () =>
			{
				mockConstructEvent.mockImplementation(
					() =>
					{
						throw new Error("Invalid signature");
					});

				const { POST } =
					await import("../../../../routes/api/webhook/stripe/+server");

				const request: Request =
					new Request(
						"http://localhost/api/webhook/stripe",
						{
							method: "POST",
							body: "{}",
							headers: { "stripe-signature": "sig_invalid" }
						});

				const response: Response =
					await POST({ request } as never);
				expect(response.status)
					.toBe(400);
			});

		it("handles checkout.session.completed",
			async () =>
			{
				const mockSession =
					{
						id: "cs_test_123",
						metadata: { cartSessionId: "cart-sess-1" },
						customer_details: { email: "buyer@test.com" },
						amount_total: 5998,
						collected_information: {
							shipping_details: {
								name: "Test User",
								address: {
									line1: "123 Main",
									city: "Portland",
									state: "OR",
									postal_code: "97201",
									country: "US"
								}
							}
						}
					};

				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: { object: mockSession }
					});

				// db.select() is called multiple times:
				// 1) Idempotency check — no existing order
				// 2) Snapshot read — returns empty (tests fallback path)
				// 3) Post-transaction fetch of created order
				// 4+) Post-transaction fetch of order items for email
				let selectCallCount: number = 0;
				mockDbSelect.mockImplementation(
					() =>
					{
						selectCallCount++;
						if (selectCallCount === 1)
						{
							// Idempotency check
							return {
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
															.mockResolvedValue([])
													})
										})
							};
						}
						if (selectCallCount === 2)
						{
							// Snapshot read — return empty to exercise fallback path
							return {
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
															.mockResolvedValue([])
													})
										})
							};
						}
						if (selectCallCount === 3)
						{
							// Post-transaction: fetch created order
							return {
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
															.mockResolvedValue(
																[
																	{
																		id: "order-1",
																		email: "buyer@test.com",
																		totalAmount: "59.98",
																		shippingName: "Test User",
																		shippingAddress: {
																			line1: "123 Main",
																			city: "Portland",
																			state: "OR",
																			postal_code: "97201",
																			country: "US"
																		}
																	}
																])
													})
										})
							};
						}
						// Post-transaction: order items for fulfillment/email
						return {
							from: vi
								.fn()
								.mockReturnValue(
									{
										innerJoin: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockResolvedValue(
															[
																{ quantity: 1, printfulSyncVariantId: "psv-1" }
															])
												}),
										where: vi
											.fn()
											.mockResolvedValue(
												[{ quantity: 1 }])
									})
						};
					});

				// db.insert() for post-transaction orderStatusHistory
				mockDbInsert.mockReturnValue(
					{
						values: vi
							.fn()
							.mockResolvedValue(undefined)
					});

				// db.update() for post-transaction order status
				mockDbUpdate.mockReturnValue(
					{
						set: vi
							.fn()
							.mockReturnValue(
								{
									where: vi
										.fn()
										.mockResolvedValue(undefined)
								})
					});

				// Transaction mock
				mockDbTransaction.mockImplementation(
					async (cb: (tx: unknown) => Promise<void>) =>
					{
						const mockTxInsert =
							vi
								.fn()
								.mockReturnValue(
									{
										values: vi
											.fn()
											.mockReturnValue(
												{
													returning: vi
														.fn()
														.mockResolvedValue(
															[{ id: "order-1" }])
												})
									});
						const mockTxSelect =
							vi
								.fn()
								.mockReturnValue(
									{
										from: vi
											.fn()
											.mockReturnValue(
												{
													where: vi
														.fn()
														.mockResolvedValue([])
												})
									});
						const mockTxDelete =
							vi
								.fn()
								.mockReturnValue(
									{
										where: vi
											.fn()
											.mockResolvedValue(undefined)
									});

						await cb(
							{
								insert: mockTxInsert,
								select: mockTxSelect,
								delete: mockTxDelete
							});
					});

				const { POST } =
					await import("../../../../routes/api/webhook/stripe/+server");

				const request: Request =
					new Request(
						"http://localhost/api/webhook/stripe",
						{
							method: "POST",
							body: JSON.stringify(mockSession),
							headers: { "stripe-signature": "sig_valid" }
						});

				const response: Response =
					await POST({ request } as never);
				expect(response.status)
					.toBe(200);
				expect(mockDbTransaction)
					.toHaveBeenCalledOnce();
			});

		it("handles duplicate delivery (idempotent)",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_test_dup",
								metadata: { cartSessionId: "cart-dup" },
								customer_details: { email: "dup@test.com" },
								amount_total: 3000
							}
						}
					});

				// Existing order found — should skip
				const mockSelectFrom =
					vi
						.fn()
						.mockReturnValue(
							{
								where: vi
									.fn()
									.mockReturnValue(
										{
											limit: vi
												.fn()
												.mockResolvedValue(
													[{ id: "existing-order" }])
										})
							});
				mockDbSelect.mockReturnValue(
					{ from: mockSelectFrom });

				const { POST } =
					await import("../../../../routes/api/webhook/stripe/+server");

				const request: Request =
					new Request(
						"http://localhost/api/webhook/stripe",
						{
							method: "POST",
							body: "{}",
							headers: { "stripe-signature": "sig_valid" }
						});

				const response: Response =
					await POST({ request } as never);
				expect(response.status)
					.toBe(200);
				expect(mockDbTransaction).not.toHaveBeenCalled();
			});

		it("returns 200 for unhandled event types",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "charge.refunded",
						data: { object: {} }
					});

				const { POST } =
					await import("../../../../routes/api/webhook/stripe/+server");

				const request: Request =
					new Request(
						"http://localhost/api/webhook/stripe",
						{
							method: "POST",
							body: "{}",
							headers: { "stripe-signature": "sig_valid" }
						});

				const response: Response =
					await POST({ request } as never);
				expect(response.status)
					.toBe(200);
				expect(mockDbTransaction).not.toHaveBeenCalled();
			});
	});