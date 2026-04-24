import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Mutable env object — individual tests override as needed. */
const mockEnv: Record<string, string | undefined> =
	{
		STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
		PRINTFUL_API_KEY: "pf_test_key"
	};

vi.mock("$env/dynamic/private", () => ({ env: mockEnv }));

const mockConstructEvent =
	vi.fn();
const mockIsOrderProcessed =
	vi.fn();
const mockHandleCheckoutCompleted =
	vi.fn();
const mockQueueLog =
	vi.fn();

vi.mock("@seventysixcommerce/shared/stripe", () => (
	{
		getStripe: () => (
			{
				webhooks: {
					constructEvent: mockConstructEvent
				}
			})
	}));

vi.mock("@seventysixcommerce/shared/webhook",
	async (importActual) =>
	{
		const actual: typeof import("@seventysixcommerce/shared/webhook") =
			await importActual<
		typeof import("@seventysixcommerce/shared/webhook")>();

		return {
			...actual,
			isOrderProcessed: mockIsOrderProcessed,
			handleCheckoutCompleted: mockHandleCheckoutCompleted
		};
	});

vi.mock("$lib/server/log-forwarder", () => (
	{
		queueLog: mockQueueLog
	}));

vi.mock("$lib/server/db", () => (
	{
		db: {}
	}));

vi.mock("$lib/server/integrations/brevo", () => (
	{
		sendOrderConfirmation: vi.fn()
	}));

vi.mock("$lib/server/integrations/printful", () => (
	{
		createPrintfulOrder: vi.fn()
	}));

vi.mock("@seventysixcommerce/shared/date", () => (
	{
		now: () => new Date("2025-01-01T00:00:00Z")
	}));

/**
 * Builds a minimal POST request for the Stripe webhook handler.
 * @param body The raw payload string.
 * @param signature The stripe-signature header value.
 */
function buildRequest(body: string, signature: string): Request
{
	return new Request(
		"http://localhost/api/webhook/stripe",
		{
			method: "POST",
			body,
			headers: { "stripe-signature": signature }
		});
}

/**
 * Builds a POST request without a stripe-signature header.
 * Used to test the null-coalescing fallback when the header is absent.
 * @param body The raw payload string.
 */
function buildRequestNoSig(body: string): Request
{
	return new Request(
		"http://localhost/api/webhook/stripe",
		{
			method: "POST",
			body
		});
}

describe("POST /api/webhook/stripe",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				// Reset to defaults
				mockEnv.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
				mockEnv.PRINTFUL_API_KEY = "pf_test_key";
			});

		afterEach(
			() =>
			{
				vi.resetModules();
			});

		it("returns 500 when STRIPE_WEBHOOK_SECRET is not configured",
			async () =>
			{
				mockEnv.STRIPE_WEBHOOK_SECRET = "";

				const { POST } =
					await import("../+server");

				const response: Response =
					await POST(
						{
							request: buildRequest("{}", "sig"),
							params: {},
							url: new URL("http://localhost"),
							route: { id: "" }
						} as never);

				expect(response.status)
					.toBe(500);
				expect(await response.text())
					.toContain("Webhook secret not configured");
				expect(mockConstructEvent)
					.not
					.toHaveBeenCalled();
			});

		it("returns 400 when stripe signature is invalid",
			async () =>
			{
				mockConstructEvent.mockImplementation(
					() =>
					{
						throw new Error("No signatures found matching the expected signature for payload");
					});

				const { POST } =
					await import("../+server");

				const response: Response =
					await POST(
						{
							request: buildRequest("{}", "bad-sig"),
							params: {},
							url: new URL("http://localhost"),
							route: { id: "" }
						} as never);

				expect(response.status)
					.toBe(400);
				expect(await response.text())
					.toContain("Invalid signature");
			});

		it("skips handleCheckoutCompleted when order is already processed",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_already_processed",
								metadata: { cartSessionId: "cart-sess-999" },
								customer_details: { email: "user@example.com" },
								amount_total: 5999,
								collected_information: null
							}
						}
					});
				mockIsOrderProcessed.mockResolvedValue(true);

				const { POST } =
					await import("../+server");

				const response: Response =
					await POST(
						{
							request: buildRequest("{}", "valid-sig"),
							params: {},
							url: new URL("http://localhost"),
							route: { id: "" }
						} as never);

				expect(response.status)
					.toBe(200);
				expect(mockHandleCheckoutCompleted)
					.not
					.toHaveBeenCalled();

				const body: unknown =
					await response.json();
				expect(body)
					.toEqual(
						{ received: true });
			});

		it("processes new checkout session via handleCheckoutCompleted",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_new_order",
								metadata: { cartSessionId: "cart-sess-001" },
								customer_details: { email: "buyer@example.com" },
								amount_total: 2999,
								collected_information: {
									shipping_details: {
										address: {
											line1: "123 Main St",
											city: "Austin",
											state: "TX",
											postal_code: "78701",
											country: "US"
										},
										name: "Jane Doe"
									}
								}
							}
						}
					});
				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				const { POST } =
					await import("../+server");

				const response: Response =
					await POST(
						{
							request: buildRequest("{}", "valid-sig"),
							params: {},
							url: new URL("http://localhost"),
							route: { id: "" }
						} as never);

				expect(response.status)
					.toBe(200);
				expect(mockHandleCheckoutCompleted)
					.toHaveBeenCalledOnce();
			});

		it("returns 200 for non-checkout event types",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "payment_intent.succeeded",
						data: { object: {} }
					});

				const { POST } =
					await import("../+server");

				const response: Response =
					await POST(
						{
							request: buildRequest("{}", "valid-sig"),
							params: {},
							url: new URL("http://localhost"),
							route: { id: "" }
						} as never);

				expect(response.status)
					.toBe(200);
				expect(mockIsOrderProcessed)
					.not
					.toHaveBeenCalled();
			});

		it("returns 400 when stripe-signature header is absent",
			async () =>
			{
				mockConstructEvent.mockImplementation(
					() =>
					{
						throw new Error("No signatures found");
					});

				const { POST } =
					await import("../+server");

				const response: Response =
					await POST(
						{
							request: buildRequestNoSig("{}"),
							params: {},
							url: new URL("http://localhost"),
							route: { id: "" }
						} as never);

				expect(response.status)
					.toBe(400);
			});

		it("passes null createPrintfulOrder when PRINTFUL_API_KEY is empty",
			async () =>
			{
				mockEnv.PRINTFUL_API_KEY = "";

				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_printful_empty",
								metadata: { cartSessionId: "cart-1" },
								customer_details: { email: "buyer@example.com" },
								amount_total: 5000,
								collected_information: null
							}
						}
					});
				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				const { POST } =
					await import("../+server");

				await POST(
					{
						request: buildRequest("{}", "valid-sig"),
						params: {},
						url: new URL("http://localhost"),
						route: { id: "" }
					} as never);

				const creator: unknown =
					mockHandleCheckoutCompleted.mock.calls[0][2];

				expect(creator)
					.toBeNull();
			});

		it("passes createPrintfulOrder function when PRINTFUL_API_KEY is present",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_printful_present",
								metadata: { cartSessionId: "cart-2" },
								customer_details: { email: "buyer@example.com" },
								amount_total: 9900,
								collected_information: null
							}
						}
					});
				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				const { POST } =
					await import("../+server");

				await POST(
					{
						request: buildRequest("{}", "valid-sig"),
						params: {},
						url: new URL("http://localhost"),
						route: { id: "" }
					} as never);

				const creator: unknown =
					mockHandleCheckoutCompleted.mock.calls[0][2];

				expect(creator)
					.not
					.toBeNull();
				expect(typeof creator)
					.toBe("function");
			});

		it("passes null shippingAddress and shippingName when collected_information is null",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_no_shipping",
								metadata: { cartSessionId: "cart-3" },
								customer_details: { email: "buyer@example.com" },
								amount_total: 3000,
								collected_information: null
							}
						}
					});
				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				const { POST } =
					await import("../+server");

				await POST(
					{
						request: buildRequest("{}", "valid-sig"),
						params: {},
						url: new URL("http://localhost"),
						route: { id: "" }
					} as never);

				const sessionData: Record<string, unknown> =
					mockHandleCheckoutCompleted.mock.calls[0][1] as Record<
						string,
						unknown>;

				expect(sessionData.shippingAddress)
					.toBeNull();
				expect(sessionData.shippingName)
					.toBeNull();
			});

		it("uses empty string for customerEmail when customer_details lacks email",
			async () =>
			{
				mockConstructEvent.mockReturnValue(
					{
						type: "checkout.session.completed",
						data: {
							object: {
								id: "cs_no_email",
								metadata: { cartSessionId: "cart-4" },
								customer_details: {},
								amount_total: 2000,
								collected_information: null
							}
						}
					});
				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				const { POST } =
					await import("../+server");

				await POST(
					{
						request: buildRequest("{}", "valid-sig"),
						params: {},
						url: new URL("http://localhost"),
						route: { id: "" }
					} as never);

				const sessionData: Record<string, unknown> =
					mockHandleCheckoutCompleted.mock.calls[0][1] as Record<
						string,
						unknown>;

				expect(sessionData.customerEmail)
					.toBe("");
			});
	});