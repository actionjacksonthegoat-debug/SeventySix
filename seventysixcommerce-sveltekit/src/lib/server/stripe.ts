import { env } from "$env/dynamic/private";
import Stripe from "stripe";
import { createMockStripe, type MockStripeClient } from "./mock/mock-stripe";

/** Stripe client or mock client type. */
export type StripeClient = Stripe | MockStripeClient;

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
		if (env.MOCK_SERVICES !== "false")
		{
			console.warn("[Stripe] Using mock service");
			client =
				createMockStripe(env.BASE_URL ?? "");
		}
		else
		{
			const key: string | undefined =
				env.STRIPE_SECRET_KEY;
			if (key === undefined)
			{
				throw new Error(
					"STRIPE_SECRET_KEY is required when MOCK_SERVICES is not true");
			}
			client =
				new Stripe(key);
		}
	}
	return client;
}