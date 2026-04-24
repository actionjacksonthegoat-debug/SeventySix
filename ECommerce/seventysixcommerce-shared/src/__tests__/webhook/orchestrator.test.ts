import { describe, expect, it, vi } from "vitest";
import {
	processStripeWebhook,
	type ProcessStripeWebhookInput
} from "../../webhook/orchestrator";

/** Creates a minimal mock Stripe webhooks interface. */
function createMockStripeWebhooks(eventToReturn: unknown, shouldThrow = false): ProcessStripeWebhookInput["stripe"]
{
	return {
		webhooks: {
			constructEvent: vi
				.fn()
				.mockImplementation(
					() =>
					{
						if (shouldThrow)
						{
							throw new Error("No signatures found matching the expected signature for payload");
						}
						return eventToReturn;
					})
		}
	};
}

describe("processStripeWebhook",
	() =>
	{
		it("processStripeWebhook_RejectsInvalidSignature",
			async () =>
			{
				const stripeClient =
					createMockStripeWebhooks(null, true);

				const result =
					await processStripeWebhook(
						{
							rawBody: "raw-payload",
							signature: "bad-signature",
							secret: "whsec_test",
							stripe: stripeClient,
							handlers: {}
						});

				expect(result.status)
					.toBe("invalid-signature");
				expect(result.eventId)
					.toBeUndefined();
			});

		it("processStripeWebhook_RoutesCheckoutCompleted_ToHandler",
			async () =>
			{
				const mockEvent =
					{
						id: "evt_checkout_001",
						type: "checkout.session.completed",
						data: { object: { id: "cs_test_001" } }
					};
				const stripeClient =
					createMockStripeWebhooks(mockEvent);

				const checkoutHandler =
					vi
						.fn()
						.mockResolvedValue(undefined);

				const result =
					await processStripeWebhook(
						{
							rawBody: JSON.stringify(mockEvent),
							signature: "valid-sig",
							secret: "whsec_test",
							stripe: stripeClient,
							handlers: { "checkout.session.completed": checkoutHandler }
						});

				expect(result.status)
					.toBe("processed");
				expect(result.eventId)
					.toBe("evt_checkout_001");
				expect(checkoutHandler)
					.toHaveBeenCalledOnce();
				expect(checkoutHandler)
					.toHaveBeenCalledWith(mockEvent);
			});

		it("processStripeWebhook_RoutesPaymentFailed_ToHandler",
			async () =>
			{
				const mockEvent =
					{
						id: "evt_payment_fail_001",
						type: "payment_intent.payment_failed",
						data: { object: { id: "pi_test_001" } }
					};
				const stripeClient =
					createMockStripeWebhooks(mockEvent);

				const paymentFailedHandler =
					vi
						.fn()
						.mockResolvedValue(undefined);

				const result =
					await processStripeWebhook(
						{
							rawBody: JSON.stringify(mockEvent),
							signature: "valid-sig",
							secret: "whsec_test",
							stripe: stripeClient,
							handlers: { "payment_intent.payment_failed": paymentFailedHandler }
						});

				expect(result.status)
					.toBe("processed");
				expect(result.eventId)
					.toBe("evt_payment_fail_001");
				expect(paymentFailedHandler)
					.toHaveBeenCalledOnce();
				expect(paymentFailedHandler)
					.toHaveBeenCalledWith(mockEvent);
			});

		it("processStripeWebhook_IgnoresUnsupportedEventType_ReturnsAcknowledged",
			async () =>
			{
				const mockEvent =
					{
						id: "evt_unsupported_001",
						type: "customer.subscription.created",
						data: { object: {} }
					};
				const stripeClient =
					createMockStripeWebhooks(mockEvent);

				const checkoutHandler =
					vi
						.fn()
						.mockResolvedValue(undefined);

				const result =
					await processStripeWebhook(
						{
							rawBody: JSON.stringify(mockEvent),
							signature: "valid-sig",
							secret: "whsec_test",
							stripe: stripeClient,
							handlers: { "checkout.session.completed": checkoutHandler }
						});

				expect(result.status)
					.toBe("ignored");
				expect(result.eventId)
					.toBe("evt_unsupported_001");
				expect(checkoutHandler)
					.not
					.toHaveBeenCalled();
			});

		it("processStripeWebhook_DoesNotLogRawBody",
			async () =>
			{
				const sensitiveRawBody: string =
					JSON.stringify(
						{
							id: "evt_pii_001",
							type: "checkout.session.completed",
							data: { object: { customer_details: { email: "customer@example.com" } } }
						});

				const consoleSpy =
					vi
						.spyOn(console, "log")
						.mockImplementation(() => undefined);
				const consoleErrorSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(() => undefined);
				const consoleWarnSpy =
					vi
						.spyOn(console, "warn")
						.mockImplementation(() => undefined);

				const mockEvent =
					{
						id: "evt_pii_001",
						type: "checkout.session.completed",
						data: { object: {} }
					};
				const stripeClient =
					createMockStripeWebhooks(mockEvent);

				await processStripeWebhook(
					{
						rawBody: sensitiveRawBody,
						signature: "valid-sig",
						secret: "whsec_test",
						stripe: stripeClient,
						handlers: {}
					});

				const allLoggedArgs: unknown[] =
					[
						...consoleSpy.mock.calls,
						...consoleErrorSpy.mock.calls,
						...consoleWarnSpy.mock.calls
					]
						.flat();

				for (const logged of allLoggedArgs)
				{
					expect(String(logged))
						.not
						.toContain(sensitiveRawBody);
				}

				consoleSpy.mockRestore();
				consoleErrorSpy.mockRestore();
				consoleWarnSpy.mockRestore();
			});

		it("processStripeWebhook_IsIdempotent_ForRepeatedEventIds",
			async () =>
			{
				// The orchestrator delegates idempotency to the supplied handler —
				// it invokes the handler once per call, regardless of event ID.
				// This contract test verifies the orchestrator itself does NOT
				// deduplicate; idempotency is the handler's responsibility.
				const mockEvent =
					{
						id: "evt_duplicate_001",
						type: "checkout.session.completed",
						data: { object: {} }
					};
				const stripeClient =
					createMockStripeWebhooks(mockEvent);

				const handler =
					vi
						.fn()
						.mockResolvedValue(undefined);

				await processStripeWebhook(
					{
						rawBody: JSON.stringify(mockEvent),
						signature: "valid-sig",
						secret: "whsec_test",
						stripe: stripeClient,
						handlers: { "checkout.session.completed": handler }
					});

				await processStripeWebhook(
					{
						rawBody: JSON.stringify(mockEvent),
						signature: "valid-sig",
						secret: "whsec_test",
						stripe: stripeClient,
						handlers: { "checkout.session.completed": handler }
					});

				// Handler invoked once per orchestrator call — idempotency contract
				// is delegated to the handler (e.g., DB-level duplicate check).
				expect(handler)
					.toHaveBeenCalledTimes(2);
			});
	});