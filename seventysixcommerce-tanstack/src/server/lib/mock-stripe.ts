import crypto from "node:crypto";
import type Stripe from "stripe";

/** Mock session data stored in memory. */
interface MockSession
{
	id: string;
	amount_total: number;
	customer_details: { email: string; };
	metadata: Record<string, string>;
	collected_information: {
		shipping_details: {
			name: string;
			address: {
				line1: string;
				city: string;
				state: string;
				postal_code: string;
				country: string;
			};
		};
	};
}

/** In-memory session store. */
const mockSessions: Map<string, MockSession> =
	new Map();

/** Shape of the mock Stripe client returned by createMockStripe. */
export interface MockStripeClient
{
	checkout: {
		sessions: {
			create: (params: Record<string, unknown>) => Promise<{ id: string; url: string; }>;
			retrieve: (sessionId: string) => Promise<MockSession>;
		};
	};
	webhooks: {
		constructEvent: (payload: string, sig: string, secret: string) => Stripe.Event;
	};
}

/**
 * Creates a mock Stripe-compatible client for demo/dev use.
 * Sessions are stored in-memory and checkout redirects to the local success page.
 */
export function createMockStripe(): MockStripeClient
{
	return {
		checkout: {
			sessions: {
				create: async (params: Record<string, unknown>) =>
				{
					const id: string =
						`mock_sess_${
							crypto
								.randomUUID()
								.slice(0, 8)
						}`;
					const lineItems: Array<{
						price_data: {
							unit_amount: number;
							product_data: { name: string; };
						};
						quantity: number;
					}> =
						params.line_items as Array<{
							price_data: {
								unit_amount: number;
								product_data: { name: string; };
							};
							quantity: number;
						}>;
					const total: number =
						lineItems.reduce(
							(sum, li) =>
								sum + li.price_data.unit_amount * li.quantity,
							0);
					const metadata: Record<string, string> =
						(params.metadata ?? {}) as Record<
							string,
							string>;
					const session: MockSession =
						{
							id,
							amount_total: total,
							customer_details: { email: "demo@SeventySixCommerce.art" },
							metadata,
							collected_information: {
								shipping_details: {
									name: "Demo Customer",
									address: {
										line1: "123 Art St",
										city: "Portland",
										state: "OR",
										postal_code: "97201",
										country: "US"
									}
								}
							}
						};
					mockSessions.set(id, session);
					const baseUrl: string =
						process.env.BASE_URL ?? "https://localhost:3002";
					return {
						id,
						url: `${baseUrl}/checkout/success?session_id=${id}`
					};
				},
				retrieve: async (sessionId: string) =>
				{
					const session: MockSession | undefined =
						mockSessions.get(sessionId);
					if (session === undefined)
					{
						throw new Error(`Mock session ${sessionId} not found`);
					}
					return session;
				}
			}
		},
		webhooks: {
			constructEvent: (
				payload: string,
				_sig: string,
				_secret: string) =>
			{
				return JSON.parse(payload);
			}
		}
	};
}