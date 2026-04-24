import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleStripeWebhook } from "../../../server/functions/webhook";

/** Hoisted so vi.mock factories can reference them before const initialization. */
const mockProcessStripeWebhook: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());
const mockQueueLog: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());
const mockHandleCheckoutCompleted: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());
const mockIsOrderProcessed: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());
const mockGetStripe: ReturnType<typeof vi.fn> =
	vi.hoisted(() =>
		vi
			.fn()
			.mockReturnValue(
				{ checkout: { sessions: { create: vi.fn() } } }));
const mockCreatePrintfulOrder: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());

vi.mock(
	"@seventysixcommerce/shared/webhook",
	() => (
		{
			processStripeWebhook: mockProcessStripeWebhook,
			handleCheckoutCompleted: mockHandleCheckoutCompleted,
			isOrderProcessed: mockIsOrderProcessed
		}));

vi.mock(
	"@seventysixcommerce/shared/stripe",
	() => (
		{
			getStripe: mockGetStripe
		}));

vi.mock(
	"~/lib/brevo",
	() => (
		{
			sendOrderConfirmation: vi.fn()
		}));

vi.mock(
	"~/lib/printful",
	() => (
		{
			createPrintfulOrder: mockCreatePrintfulOrder
		}));

vi.mock(
	"~/server/db",
	() => (
		{
			db: {}
		}));

vi.mock(
	"~/server/log-forwarder",
	() => (
		{
			queueLog: mockQueueLog
		}));

vi.mock(
	"@seventysixcommerce/shared/date",
	() => (
		{
			now: () => new Date("2025-01-01T00:00:00Z")
		}));

describe("handleStripeWebhook",
	() =>
	{
		beforeEach(
			() =>
			{
				vi.clearAllMocks();
				process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
				process.env.STRIPE_SECRET_KEY = "sk_test_fake";
				process.env.MOCK_SERVICES = "false";
			});

		afterEach(
			() =>
			{
				delete process.env.STRIPE_WEBHOOK_SECRET;
				delete process.env.STRIPE_SECRET_KEY;
				delete process.env.MOCK_SERVICES;
				delete process.env.BASE_URL;
				delete process.env.PRINTFUL_API_KEY;
			});

		it("handleStripeWebhook_ThrowsError_WhenSecretNotConfigured",
			async () =>
			{
				process.env.STRIPE_WEBHOOK_SECRET = "";

				await expect(
					handleStripeWebhook("{}", "sig"))
					.rejects
					.toThrow("Webhook secret not configured");

				expect(mockQueueLog)
					.toHaveBeenCalledWith(
						expect.objectContaining(
							{ logLevel: "Error" }));
			});

		it("handleStripeWebhook_CallsProcessStripeWebhook_WithCorrectArgs",
			async () =>
			{
				mockProcessStripeWebhook.mockResolvedValue(
					{ status: "ok" });

				await handleStripeWebhook("{}", "sig=test");

				expect(mockProcessStripeWebhook)
					.toHaveBeenCalledOnce();

				const callArgs: Record<string, unknown> =
					mockProcessStripeWebhook.mock.calls[0][0] as Record<string, unknown>;

				expect(callArgs.secret)
					.toBe("whsec_test_secret");
				expect(callArgs.rawBody)
					.toBe("{}");
				expect(callArgs.signature)
					.toBe("sig=test");
			});

		it("handleStripeWebhook_ReturnsReceived_OnSuccess",
			async () =>
			{
				mockProcessStripeWebhook.mockResolvedValue(
					{ status: "ok" });

				const result: { received: boolean; } =
					await handleStripeWebhook("{}", "sig=test");

				expect(result)
					.toEqual(
						{ received: true });
			});

		it("handleStripeWebhook_ThrowsError_WhenSignatureInvalid",
			async () =>
			{
				mockProcessStripeWebhook.mockResolvedValue(
					{ status: "invalid-signature" });

				await expect(
					handleStripeWebhook("{}", "bad_sig"))
					.rejects
					.toThrow("Invalid webhook signature");
			});

		it("handleStripeWebhook_CheckoutSessionCompleted_AlreadyProcessed_SkipsHandleCheckoutCompleted",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_test_already_processed",
						metadata: { cartSessionId: "cart-1" },
						customer_details: { email: "buyer@example.com" },
						amount_total: 5000,
						collected_information: null
					};

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(true);

				await handleStripeWebhook("{}", "sig=test");

				expect(mockHandleCheckoutCompleted)
					.not
					.toHaveBeenCalled();
			});

		it("handleStripeWebhook_CheckoutSessionCompleted_NotProcessed_CallsHandleCheckoutCompleted",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_test_new_order",
						metadata: { cartSessionId: "cart-2" },
						customer_details: { email: "buyer2@example.com" },
						amount_total: 9900,
						collected_information: {
							shipping_details: {
								address: { line1: "123 Main St", city: "Springfield" },
								name: "Jane Buyer"
							}
						}
					};

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				await handleStripeWebhook("{}", "sig=test");

				expect(mockHandleCheckoutCompleted)
					.toHaveBeenCalledOnce();
			});

		it("handleStripeWebhook_WhenMockServicesNotFalse_CallsGetStripeWithUseMocksTrue",
			async () =>
			{
				delete process.env.MOCK_SERVICES;

				mockProcessStripeWebhook.mockResolvedValue(
					{ status: "ok" });

				await handleStripeWebhook("{}", "sig=test");

				const stripeOptions: Record<string, unknown> =
					mockGetStripe.mock.calls[0][0] as Record<string, unknown>;

				expect(stripeOptions.useMocks)
					.toBe(true);
			});

		it("handleStripeWebhook_WhenBaseUrlUnset_UsesDefaultBaseUrl",
			async () =>
			{
				mockProcessStripeWebhook.mockResolvedValue(
					{ status: "ok" });

				await handleStripeWebhook("{}", "sig=test");

				const stripeOptions: Record<string, unknown> =
					mockGetStripe.mock.calls[0][0] as Record<string, unknown>;

				expect(stripeOptions.baseUrl)
					.toBe("https://localhost:3002");
			});

		it("handleStripeWebhook_WhenPrintfulKeyEmpty_PassesNullCreatorToHandler",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_printful_empty",
						metadata: { cartSessionId: "cart-1" },
						customer_details: { email: "buyer@example.com" },
						amount_total: 5000,
						collected_information: null
					};

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				await handleStripeWebhook("{}", "sig=test");

				const printfulArg: unknown =
					mockHandleCheckoutCompleted.mock.calls[0][2];

				expect(printfulArg)
					.toBeNull();
			});

		it("handleStripeWebhook_WhenPrintfulKeyPresent_PassesCreatePrintfulOrderToHandler",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_printful_present",
						metadata: { cartSessionId: "cart-2" },
						customer_details: { email: "buyer@example.com" },
						amount_total: 9900,
						collected_information: null
					};

				process.env.PRINTFUL_API_KEY = "pf_test_key";

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				await handleStripeWebhook("{}", "sig=test");

				const printfulArg: unknown =
					mockHandleCheckoutCompleted.mock.calls[0][2];

				expect(printfulArg)
					.toBe(mockCreatePrintfulOrder);
			});

		it("handleStripeWebhook_WhenCartSessionIdMissing_UsesEmptyStringFallback",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_no_cart_id",
						metadata: {},
						customer_details: { email: "buyer@example.com" },
						amount_total: 3000,
						collected_information: null
					};

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				await handleStripeWebhook("{}", "sig=test");

				const sessionData: Record<string, unknown> =
					mockHandleCheckoutCompleted.mock.calls[0][1] as Record<
						string,
						unknown>;

				expect(sessionData.cartSessionId)
					.toBe("");
			});

		it("handleStripeWebhook_WhenCustomerEmailMissing_UsesEmptyStringFallback",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_no_email",
						metadata: { cartSessionId: "cart-3" },
						customer_details: {},
						amount_total: 2000,
						collected_information: null
					};

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				await handleStripeWebhook("{}", "sig=test");

				const sessionData: Record<string, unknown> =
					mockHandleCheckoutCompleted.mock.calls[0][1] as Record<
						string,
						unknown>;

				expect(sessionData.customerEmail)
					.toBe("");
			});

		it("handleStripeWebhook_WhenShippingDetailsMissing_PassesNullAddressAndName",
			async () =>
			{
				const mockSession: Record<string, unknown> =
					{
						id: "cs_no_shipping",
						metadata: { cartSessionId: "cart-4" },
						customer_details: { email: "buyer@example.com" },
						amount_total: 4000,
						collected_information: { shipping_details: null }
					};

				mockProcessStripeWebhook.mockImplementation(
					async ({ handlers }: { handlers: Record<string, (event: unknown) => Promise<void>>; }) =>
					{
						await handlers["checkout.session.completed"](
							{ data: { object: mockSession } });
						return { status: "ok" };
					});

				mockIsOrderProcessed.mockResolvedValue(false);
				mockHandleCheckoutCompleted.mockResolvedValue(undefined);

				await handleStripeWebhook("{}", "sig=test");

				const sessionData: Record<string, unknown> =
					mockHandleCheckoutCompleted.mock.calls[0][1] as Record<
						string,
						unknown>;

				expect(sessionData.shippingAddress)
					.toBeNull();
				expect(sessionData.shippingName)
					.toBeNull();
			});
	});