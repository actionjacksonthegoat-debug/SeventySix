import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleStripeWebhook } from "../../../server/functions/webhook";

/** Hoisted so vi.mock factories can reference them before const initialization. */
const mockProcessStripeWebhook: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());
const mockQueueLog: ReturnType<typeof vi.fn> =
	vi.hoisted(() => vi.fn());

vi.mock(
	"@seventysixcommerce/shared/webhook",
	() => (
		{
			processStripeWebhook: mockProcessStripeWebhook,
			handleCheckoutCompleted: vi.fn(),
			isOrderProcessed: vi.fn()
		}));

vi.mock(
	"@seventysixcommerce/shared/stripe",
	() => (
		{
			getStripe: vi
				.fn()
				.mockReturnValue(
					{
						checkout: { sessions: { create: vi.fn() } }
					})
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
			createPrintfulOrder: vi.fn()
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
	});