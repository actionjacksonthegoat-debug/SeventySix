import Stripe from "stripe";
import { createMockStripe } from "./mock-stripe";

/** Stripe client or mock client type. */
export type StripeClient = Stripe | ReturnType<typeof createMockStripe>;

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
		if (process.env.MOCK_SERVICES !== "false")
		{
			console.warn("[Stripe] Using mock service");
			client =
				createMockStripe();
		}
		else
		{
			const key: string | undefined =
				process.env.STRIPE_SECRET_KEY;
			if (key === undefined)
			{
				throw new Error(
					"STRIPE_SECRET_KEY environment variable is required when MOCK_SERVICES is not true");
			}
			client =
				new Stripe(key);
		}
	}
	return client;
}