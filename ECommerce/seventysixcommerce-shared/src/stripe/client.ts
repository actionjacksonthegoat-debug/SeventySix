/**
 * Caching Stripe client factory.
 * Wraps {@link createStripeClient} with per-key instance caching so that
 * repeated calls with the same configuration return the same client.
 */
import { isNullOrUndefined, isPresent } from "../utils/null-check";
import { createStripeClient, type StripeClient, type StripeClientConfig } from "./index";

/** Cache of initialized Stripe clients, keyed by secret key (or "__mock__" for mock mode). */
const clientCache: Map<string, StripeClient> =
	new Map();

/**
 * Returns a cached Stripe client for the given configuration.
 * Creates a new client on first call; returns the same instance on subsequent calls
 * with an equivalent secret key.
 *
 * @param config - Stripe client configuration. See {@link StripeClientConfig}.
 * @returns A real Stripe client or mock client, cached by secret key.
 * @throws {Error} When `secretKey` is missing and `useMocks` is false.
 */
export function getStripe(config: StripeClientConfig): StripeClient
{
	const cacheKey: string =
		config.useMocks ? "__mock__" : (config.secretKey ?? "__missing__");

	const cached: StripeClient | undefined =
		clientCache.get(cacheKey);

	if (isPresent(cached))
	{
		return cached;
	}

	if (!config.useMocks && isNullOrUndefined(config.secretKey))
	{
		throw new Error(
			"STRIPE_SECRET_KEY is required when MOCK_SERVICES is not true");
	}

	const client: StripeClient =
		createStripeClient(config);

	clientCache.set(cacheKey, client);
	return client;
}

/**
 * Clears the internal Stripe client cache.
 * Intended for use in tests only — do not call in production code.
 */
export function _clearStripeCache(): void
{
	clientCache.clear();
}