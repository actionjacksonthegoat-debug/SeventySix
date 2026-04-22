import { describe, expect, it } from "vitest";
import { createStripeClient } from "../index";

describe("createStripeClient",
	() =>
	{
		it("returns mock client when useMocks is true",
			() =>
			{
				const client =
					createStripeClient(
						{
							secretKey: undefined,
							useMocks: true,
							baseUrl: "http://localhost:3001"
						});

				expect(client)
					.toBeDefined();
				expect(client.checkout)
					.toBeDefined();
				expect(client.checkout.sessions)
					.toBeDefined();
				expect(typeof client.checkout.sessions.create)
					.toBe("function");
				expect(typeof client.checkout.sessions.retrieve)
					.toBe("function");
			});

		it("throws error when Stripe secret is missing and mocks disabled",
			() =>
			{
				expect(() =>
					createStripeClient(
						{
							secretKey: undefined,
							useMocks: false,
							baseUrl: "http://localhost:3001"
						}))
					.toThrow("STRIPE_SECRET_KEY is required when MOCK_SERVICES is not true");
			});

		it("creates real Stripe client when secret provided and mocks disabled",
			() =>
			{
				const client =
					createStripeClient(
						{
							secretKey: "sk_test_fake_key_for_unit_test",
							useMocks: false,
							baseUrl: "http://localhost:3001"
						});

				expect(client)
					.toBeDefined();
				expect(client.checkout)
					.toBeDefined();
			});
	});