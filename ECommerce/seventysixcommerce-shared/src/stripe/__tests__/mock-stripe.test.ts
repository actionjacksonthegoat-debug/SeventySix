import { beforeEach, describe, expect, it } from "vitest";
import { MOCK_CUSTOMER_EMAIL } from "../../constants";
import { _clearMockSessions, createMockStripe } from "../mock-stripe";

describe("createMockStripe",
	() =>
	{
		beforeEach(
			() =>
			{
				_clearMockSessions();
			});

		it("creates mock checkout session with correct URLs",
			async () =>
			{
				const mock =
					createMockStripe("http://localhost:3001");
				const session =
					await mock.checkout.sessions.create(
						{
							line_items: [
								{
									price_data: {
										unit_amount: 2500,
										product_data: { name: "Test Product" }
									},
									quantity: 2
								}
							],
							metadata: { orderId: "test-order-123" }
						});

				expect(session.id)
					.toMatch(/^cs_test_mock/);
				expect(session.url)
					.toContain("http://localhost:3001/checkout/success?session_id=");
			});

		it("processes webhook event correctly",
			() =>
			{
				const mock =
					createMockStripe("http://localhost:3001");
				const payload: string =
					JSON.stringify(
						{
							type: "checkout.session.completed",
							data: { object: { id: "cs_123" } }
						});
				const event =
					mock.webhooks.constructEvent(payload, "sig", "secret");

				expect(event)
					.toEqual(
						{
							type: "checkout.session.completed",
							data: { object: { id: "cs_123" } }
						});
			});

		it("payment_status field is present in mock session",
			async () =>
			{
				const mock =
					createMockStripe("http://localhost:3001");
				const created =
					await mock.checkout.sessions.create(
						{
							line_items: [
								{
									price_data: {
										unit_amount: 1000,
										product_data: { name: "Art Print" }
									},
									quantity: 1
								}
							]
						});

				const session =
					await mock.checkout.sessions.retrieve(created.id);

				expect(session.payment_status)
					.toBe("paid");
				expect(session.customer_details.email)
					.toBe(MOCK_CUSTOMER_EMAIL);
				expect(session.amount_total)
					.toBe(1000);
				expect(session.line_items.data)
					.toHaveLength(1);
				expect(session.line_items.data[0].description)
					.toBe("Art Print");
			});

		it("throws when retrieving nonexistent session",
			async () =>
			{
				const mock =
					createMockStripe("http://localhost:3001");

				await expect(
					mock.checkout.sessions.retrieve("cs_nonexistent"))
					.rejects
					.toThrow("Mock session cs_nonexistent not found");
			});
	});