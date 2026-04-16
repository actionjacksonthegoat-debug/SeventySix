import { env } from "$env/dynamic/private";
import { createStripeClient, type StripeClient } from "@seventysixcommerce/shared/stripe";

export type { StripeClient } from "@seventysixcommerce/shared/stripe";

/** Cached client instance. */
let client: StripeClient | null = null;

/**
 * Returns the shared Stripe client, creating it on first call.
 * Uses mock client when MOCK_SERVICES is not "false", otherwise requires STRIPE_SECRET_KEY.
 * @returns The initialized Stripe client (real or mock).
 */
export function getStripe(): StripeClient
{
	if (client === null)
	{
		client =
			createStripeClient(
				{
					secretKey: env.STRIPE_SECRET_KEY,
					useMocks: env.MOCK_SERVICES !== "false",
					baseUrl: env.BASE_URL ?? ""
				});
	}
	return client;
}