import { createStripeClient, type StripeClient } from "@seventysixcommerce/shared/stripe";
import { isNullOrUndefined } from "@seventysixcommerce/shared/utils";

/** Cached client instance. */
let client: StripeClient | null = null;

/**
 * Returns the shared Stripe client, creating it on first call.
 * Uses mock client when MOCK_SERVICES is not "false", otherwise requires STRIPE_SECRET_KEY.
 * @returns The initialized Stripe client (real or mock).
 */
export function getStripe(): StripeClient
{
	if (isNullOrUndefined(client))
	{
		client =
			createStripeClient(
				{
					secretKey: process.env.STRIPE_SECRET_KEY,
					useMocks: process.env.MOCK_SERVICES !== "false",
					baseUrl: process.env.BASE_URL ?? "https://localhost:3002"
				});
	}
	return client;
}