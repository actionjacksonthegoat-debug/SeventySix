import {
	type CheckoutSessionData,
	handleCheckoutCompleted,
	isOrderProcessed
} from "@seventysixcommerce/shared/webhook";
import type Stripe from "stripe";
import { sendOrderConfirmation } from "../../lib/brevo";
import { now } from "../../lib/date";
import { createPrintfulOrder } from "../../lib/printful";
import { db } from "../db";
import { getStripe } from "../lib/stripe";

/**
 * Processes a Stripe webhook event. Verifies signature, then routes to handler.
 * CSRF is NOT required — Stripe uses its own signature verification.
 */
export async function handleStripeWebhook(
	rawBody: string,
	signature: string): Promise<{ received: boolean; }>
{
	let event: Stripe.Event;

	try
	{
		event =
			getStripe().webhooks.constructEvent(
				rawBody,
				signature,
				process.env.STRIPE_WEBHOOK_SECRET ?? "");
	}
	catch
	{
		throw new Error("Invalid webhook signature");
	}

	switch (event.type)
	{
		case "checkout.session.completed":
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
			break;
		}
			// Additional event types can be added here
	}

	return { received: true };
}