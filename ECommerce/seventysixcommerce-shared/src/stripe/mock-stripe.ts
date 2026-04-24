import crypto from "node:crypto";
import { MOCK_CUSTOMER_EMAIL } from "../constants";
import { isNullOrUndefined } from "../utils/null-check";

/** Mock checkout session data stored in memory. */
export interface MockSession
{
	id: string;
	amount_total: number;
	payment_status: "paid";
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
	line_items: {
		data: Array<{
			description: string | null;
			quantity: number | null;
			amount_total: number;
		}>;
	};
}

/** In-memory session store for mock checkout sessions. */
const mockSessions: Map<string, MockSession> =
	new Map();

/** Shape of the mock Stripe client returned by {@link createMockStripe}. */
export interface MockStripeClient
{
	checkout: {
		sessions: {
			create: (params: Record<string, unknown>) => Promise<{ id: string; url: string; }>;
			retrieve: (sessionId: string) => Promise<MockSession>;
		};
	};
	webhooks: {
		constructEvent: (payload: string | Buffer, sig: string, secret: string) => unknown;
	};
}

/**
 * Safely parses a raw JSON string as a Stripe-like event payload.
 * @param raw - The raw JSON body from the webhook request.
 * @returns The parsed event object.
 * @throws Error with a descriptive message when the payload is malformed.
 */
function safeParseStripeBody<T>(raw: string): T
{
	try
	{
		return JSON.parse(raw) as T;
	}
	catch (error: unknown)
	{
		throw new Error(
			`Invalid mock Stripe payload: ${(error as Error).message}`);
	}
}

/**
 * Creates a mock Stripe-compatible client for demo/dev use.
 * Sessions are stored in-memory and checkout redirects to the local success page.
 * @param baseUrl - The application base URL for constructing redirect URLs.
 * @returns A mock Stripe client with checkout and webhook support.
 */
export function createMockStripe(baseUrl: string): MockStripeClient
{
	return {
		checkout: {
			sessions: {
				create: async (params: Record<string, unknown>) =>
				{
					const id: string =
						`cs_test_mock${
							crypto
								.randomUUID()
								.replaceAll("-", "")
								.slice(0, 16)
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
							(sum, lineItem) =>
								sum + lineItem.price_data.unit_amount * lineItem.quantity,
							0);
					const metadata: Record<string, string> =
						(params.metadata ?? {}) as Record<
							string,
							string>;
					const session: MockSession =
						{
							id,
							amount_total: total,
							payment_status: "paid",
							customer_details: { email: MOCK_CUSTOMER_EMAIL },
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
							},
							line_items: {
								data: lineItems
									.map((lineItem) => ({
										description: lineItem.price_data.product_data.name,
										quantity: lineItem.quantity,
										amount_total: lineItem.price_data.unit_amount * lineItem.quantity
									}))
							}
						};
					mockSessions.set(id, session);
					return {
						id,
						url: `${baseUrl}/checkout/success?session_id=${id}`
					};
				},
				retrieve: async (sessionId: string) =>
				{
					const session: MockSession | undefined =
						mockSessions.get(sessionId);
					if (isNullOrUndefined(session))
					{
						throw new Error(`Mock session ${sessionId} not found`);
					}
					return session;
				}
			}
		},
		webhooks: {
			constructEvent: (
				payload: string | Buffer,
				_sig: string,
				_secret: string) =>
			{
				const raw: string =
					typeof payload === "string"
						? payload
						: payload.toString("utf-8");

				return safeParseStripeBody(raw);
			}
		}
	};
}

/**
 * Clears all mock sessions. For testing only.
 */
export function _clearMockSessions(): void
{
	mockSessions.clear();
}