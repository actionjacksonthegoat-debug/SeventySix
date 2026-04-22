import { describe, expect, it } from "vitest";
import { createMockStripe } from "../mock-stripe";

const TEST_BASE_URL: string = "https://localhost:3001";

describe("Mock Stripe",
	() =>
	{
		it("creates a session with a mock URL and stores it for retrieval",
			async () =>
			{
				const stripe =
					createMockStripe(TEST_BASE_URL);
				const session =
					await stripe.checkout.sessions.create(
						{
							line_items: [
								{
									price_data: {
										unit_amount: 2999,
										product_data: { name: "Test Print" }
									},
									quantity: 2
								}
							],
							metadata: { cartSessionId: "cart-123" }
						});

				expect(session.id)
					.toMatch(/^cs_test_mock/);
				expect(session.url)
					.toContain("/checkout/success?session_id=");

				const retrieved =
					await stripe.checkout.sessions.retrieve(session.id);
				expect(retrieved.amount_total)
					.toBe(5998);
				expect(retrieved.metadata.cartSessionId)
					.toBe("cart-123");
				expect(retrieved.customer_details.email)
					.toBe("mock-customer@example.com");
			});

		it("throws on retrieve of unknown session",
			async () =>
			{
				const stripe =
					createMockStripe(TEST_BASE_URL);
				await expect(
					stripe.checkout.sessions.retrieve("nonexistent"))
					.rejects
					.toThrow("Mock session nonexistent not found");
			});

		it("constructEvent parses JSON payload",
			() =>
			{
				const stripe =
					createMockStripe(TEST_BASE_URL);
				const payload: string =
					JSON.stringify(
						{
							type: "checkout.session.completed"
						});
				const event =
					stripe.webhooks.constructEvent(payload, "sig", "secret") as Record<string, unknown>;
				expect(event.type)
					.toBe("checkout.session.completed");
			});
	});