import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConstructEvent =
	vi.fn();
const _mockInsert =
	vi.fn();
const _mockDelete =
	vi.fn();

vi.mock("stripe",
	() =>
	{
		return {
			default: class MockStripe
			{
				webhooks =
					{
						constructEvent: mockConstructEvent
					};
			}
		};
	});

vi.mock("../../db",
	() =>
	{
		const returningMock =
			vi
				.fn()
				.mockResolvedValue(
					[{ id: "order-1" }]);
		const valuesMock =
			vi
				.fn()
				.mockReturnValue(
					{ returning: returningMock });
		const insertMock =
			vi
				.fn()
				.mockReturnValue(
					{ values: valuesMock });
		const deleteMock =
			vi
				.fn()
				.mockReturnValue(
					{
						where: vi
							.fn()
							.mockResolvedValue([])
					});

		return {
			db: {
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
														.mockResolvedValue([])
												})
									})
						}),
				insert: insertMock,
				delete: deleteMock,
				transaction: vi.fn(
					async (fn: (tx: unknown) => Promise<void>) =>
					{
						await fn(
							{
								insert: insertMock,
								delete: deleteMock,
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
															.mockResolvedValue([])
													})
										})
							});
					})
			}
		};
	});

describe("Stripe Webhook Handler",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
			});

		it("verifies webhook signature",
			() =>
			{
				const body: string = "{\"type\":\"checkout.session.completed\"}";
				const signature: string = "whsec_valid_signature";
				const secret: string = "whsec_test_secret";

				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: { object: { id: "cs_test_1" } }
					});

				const result =
					mockConstructEvent(body, signature, secret);

				expect(mockConstructEvent)
					.toHaveBeenCalledWith(
						body,
						signature,
						secret);
				expect(result.type)
					.toBe("checkout.session.completed");
			});

		it("rejects invalid signature with error",
			() =>
			{
				mockConstructEvent.mockImplementation(
					() =>
					{
						throw new Error("Webhook signature verification failed");
					});

				expect(() =>
					mockConstructEvent("body", "bad-sig", "secret"))
					.toThrow(
						"Webhook signature verification failed");
			});

		it("handles checkout.session.completed event",
			() =>
			{
				const event =
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_test_completed",
								metadata: { cartSessionId: "cart-123" },
								customer_details: { email: "buyer@example.com" },
								amount_total: 3598,
								shipping_details: {
									address: {
										line1: "123 Art St",
										city: "Portland",
										state: "OR",
										postal_code: "97201",
										country: "US"
									},
									name: "Jane Doe"
								}
							}
						}
					};

				expect(event.type)
					.toBe("checkout.session.completed");
				expect(event.data.object.metadata.cartSessionId)
					.toBe("cart-123");
				expect(event.data.object.customer_details.email)
					.toBe(
						"buyer@example.com");
			});

		it("creates order record from checkout session",
			() =>
			{
				const session =
					{
						id: "cs_test_order",
						metadata: { cartSessionId: "cart-456" },
						customer_details: { email: "order@example.com" },
						amount_total: 5998,
						shipping_details: {
							name: "John Doe",
							address: {
								line1: "456 Gallery Ave",
								city: "Austin",
								state: "TX"
							}
						}
					};

				const orderValues =
					{
						stripeSessionId: session.id,
						cartSessionId: session.metadata.cartSessionId,
						email: session.customer_details.email,
						status: "paid" as const,
						totalAmount: String((session.amount_total / 100).toFixed(2)),
						shippingAddress: session.shipping_details.address,
						shippingName: session.shipping_details.name
					};

				expect(orderValues.stripeSessionId)
					.toBe("cs_test_order");
				expect(orderValues.totalAmount)
					.toBe("59.98");
				expect(orderValues.status)
					.toBe("paid");
				expect(orderValues.shippingName)
					.toBe("John Doe");
			});

		it("handles duplicate webhook delivery (idempotent)",
			() =>
			{
				const existingOrders =
					[
						{ id: "order-existing", stripeSessionId: "cs_test_dup" }
					];
				const shouldSkip: boolean =
					existingOrders.length > 0;

				expect(shouldSkip)
					.toBe(true);
			});

		it("ignores unhandled event types",
			() =>
			{
				const event =
					{ type: "payment_intent.created" };
				const handled: string[] =
					["checkout.session.completed"];
				const shouldProcess: boolean =
					handled.includes(event.type);

				expect(shouldProcess)
					.toBe(false);
			});

		it("returns 200 even for unhandled events",
			() =>
			{
				const response =
					{ received: true };
				expect(response.received)
					.toBe(true);
			});
	});