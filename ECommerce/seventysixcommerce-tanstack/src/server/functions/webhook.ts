import { now } from "@seventysixcommerce/shared/date";
import { getStripe, type StripeClient } from "@seventysixcommerce/shared/stripe";
import { isNullOrEmpty } from "@seventysixcommerce/shared/utils";
import {
	type CheckoutSessionData,
	handleCheckoutCompleted,
	isOrderProcessed,
	processStripeWebhook,
	type ProcessStripeWebhookResult,
	type StripeEvent
} from "@seventysixcommerce/shared/webhook";
import type Stripe from "stripe";
import { sendOrderConfirmation } from "../../lib/brevo";
import { createPrintfulOrder } from "../../lib/printful";
import { db } from "../db";
import { queueLog } from "../log-forwarder";

/**
 * Processes a Stripe webhook event. Verifies signature, then routes to handler.
 * CSRF is NOT required — Stripe uses its own signature verification.
 */
export async function handleStripeWebhook(
	rawBody: string,
	signature: string): Promise<{ received: boolean; }>
{
	const secret: string | undefined =
		process.env.STRIPE_WEBHOOK_SECRET;
	if (isNullOrEmpty(secret))
	{
		queueLog(
			{
				logLevel: "Error",
				message: "STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook"
			});
		throw new Error("Webhook secret not configured");
	}

	const stripe: StripeClient =
		getStripe(
			{
				secretKey: process.env.STRIPE_SECRET_KEY,
				useMocks: process.env.MOCK_SERVICES !== "false",
				baseUrl: process.env.BASE_URL ?? "https://localhost:3002"
			});

	const result: ProcessStripeWebhookResult =
		await processStripeWebhook(
			{
				rawBody,
				signature,
				secret,
				stripe,
				handlers: {
					"checkout.session.completed": async (event: StripeEvent): Promise<void> =>
					{
						const session: Stripe.Checkout.Session =
							event.data.object as Stripe.Checkout.Session;

						const alreadyProcessed: boolean =
							await isOrderProcessed(db, session.id);
						if (!alreadyProcessed)
						{
							const sessionData: CheckoutSessionData =
								{
									stripeSessionId: session.id,
									cartSessionId: session.metadata?.cartSessionId ?? "",
									customerEmail: session.customer_details?.email ?? "",
									amountTotalCents: session.amount_total ?? null,
									shippingAddress: (session.collected_information?.shipping_details?.address
										?? null) as Record<string, string> | null,
									shippingName: session.collected_information?.shipping_details?.name
										?? null
								};

							const printfulApiKey: string =
								process.env.PRINTFUL_API_KEY ?? "";

							await handleCheckoutCompleted(
								db,
								sessionData,
								printfulApiKey !== "" ? createPrintfulOrder : null,
								sendOrderConfirmation,
								now);
						}
					}
				}
			});

	if (result.status === "invalid-signature")
	{
		throw new Error("Invalid webhook signature");
	}

	return { received: true };
}