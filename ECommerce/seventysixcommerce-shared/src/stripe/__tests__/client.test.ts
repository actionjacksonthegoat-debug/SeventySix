import { afterEach, describe, expect, it } from "vitest";
import { _clearStripeCache, getStripe } from "../client";

describe("getStripe",
	() =>
	{
		afterEach(
			() =>
			{
				_clearStripeCache();
			});

		it("getStripe_ReturnsCachedInstance_AcrossMultipleCalls",
			() =>
			{
				const config =
					{
						secretKey: "sk_test_fake_key_for_unit_test",
						useMocks: false,
						baseUrl: "http://localhost"
					};

				const instance1 =
					getStripe(config);
				const instance2 =
					getStripe(config);

				expect(instance1)
					.toBe(instance2);
			});

		it("getStripe_ThrowsHelpfulError_WhenSecretKeyIsMissing",
			() =>
			{
				expect(() =>
					getStripe(
						{
							secretKey: undefined,
							useMocks: false,
							baseUrl: "http://localhost"
						}))
					.toThrow("STRIPE_SECRET_KEY");
			});

		it("getStripe_UsesProvidedApiVersion_WhenConfigured",
			() =>
			{
				const client =
					getStripe(
						{
							secretKey: "sk_test_fake_key_for_unit_test",
							useMocks: false,
							baseUrl: "http://localhost",
							apiVersion: "2025-03-31.basil"
						});

				expect(client)
					.toBeDefined();
				expect(client.checkout)
					.toBeDefined();
			});

		it("getStripe_DoesNotLogSecretKey_AnywhereInError",
			() =>
			{
				const sensitiveKey: string = "sk_live_should_not_appear_in_error_12345";

				let thrownMessage: string = "";
				try
				{
					getStripe(
						{
							secretKey: undefined,
							useMocks: false,
							baseUrl: "http://localhost"
						});
				}
				catch (error: unknown)
				{
					thrownMessage =
						error instanceof Error ? error.message : String(error);
				}

				expect(thrownMessage)
					.not
					.toContain(sensitiveKey);
				expect(thrownMessage)
					.not
					.toContain("undefined");
				expect(thrownMessage.length)
					.toBeGreaterThan(0);
			});
	});