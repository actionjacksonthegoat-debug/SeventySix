/**
 * Shared Stripe client factory.
 * Creates either a real Stripe client or a mock based on configuration.
 */
import Stripe from "stripe";
import { createMockStripe, type MockStripeClient } from "./mock-stripe";

export type { MockSession, MockStripeClient } from "./mock-stripe";
export { _clearMockSessions, createMockStripe } from "./mock-stripe";

/** Stripe client or mock client type. */
export type StripeClient = Stripe | MockStripeClient;

/** Configuration for the Stripe client factory. */
export interface StripeClientConfig
{
	/** Stripe secret key from environment. */
	secretKey: string | undefined;
	/** Whether mock services are enabled. */
	useMocks: boolean;
	/** Base URL for mock success/cancel redirects. */
	baseUrl: string;
}

/**
 * Creates a Stripe client or mock based on environment configuration.
 * @param config - The Stripe client configuration.
 * @returns A real Stripe client or mock client.
 */
export function createStripeClient(config: StripeClientConfig): StripeClient
{
	if (config.useMocks)
	{
		return createMockStripe(config.baseUrl);
	}

	if (config.secretKey === undefined)
	{
		throw new Error(
			"STRIPE_SECRET_KEY is required when MOCK_SERVICES is not true");
	}

	return new Stripe(config.secretKey);
}