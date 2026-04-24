/**
 * Shared Stripe client factory.
 * Creates either a real Stripe client or a mock based on configuration.
 */
import Stripe from "stripe";
import { isNullOrUndefined } from "../utils/null-check";
import { createMockStripe, type MockStripeClient } from "./mock-stripe";

export { _clearStripeCache, getStripe } from "./client";
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
	/**
	 * Optional Stripe API version to pin for this client.
	 * When omitted the Stripe SDK uses its built-in default.
	 */
	apiVersion?: string;
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

	if (isNullOrUndefined(config.secretKey))
	{
		throw new Error(
			"STRIPE_SECRET_KEY is required when MOCK_SERVICES is not true");
	}

	return new Stripe(
		config.secretKey,
		(isNullOrUndefined(config.apiVersion)
			? undefined
			: { apiVersion: config.apiVersion }) as ConstructorParameters<typeof Stripe>[1]);
}