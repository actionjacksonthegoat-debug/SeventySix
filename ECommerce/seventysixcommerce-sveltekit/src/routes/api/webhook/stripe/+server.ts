import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { sendOrderConfirmation } from "$lib/server/integrations/brevo";
import { createPrintfulOrder } from "$lib/server/integrations/printful";
import { getStripe } from "$lib/server/stripe";
import { now } from "@seventysixcommerce/shared/date";
import {
	type CheckoutSessionData,
	handleCheckoutCompleted,
	isOrderProcessed
} from "@seventysixcommerce/shared/webhook";
import type Stripe from "stripe";
import type { RequestHandler } from "./$types";

/**
 * Stripe webhook handler.
 * CSRF not required — Stripe uses signature verification.
 */
export const POST: RequestHandler =
	async ({ request }) =>
	{
		const payload: string =
			await request.text();
		const signature: string =
			request.headers.get("stripe-signature") ?? "";

		const stripe =
			getStripe();
		let event: Stripe.Event;
		try
		{
			event =
				stripe.webhooks.constructEvent(
					payload,
					signature,
					env.STRIPE_WEBHOOK_SECRET ?? "") as Stripe.Event;
		}
		catch
		{
			return new Response("Invalid signature",
				{ status: 400 });
		}

		if (event.type === "checkout.session.completed")
		{
			const session =
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
					env.PRINTFUL_API_KEY ?? "";

				await handleCheckoutCompleted(
					db,
					sessionData,
					printfulApiKey !== "" ? createPrintfulOrder : null,
					sendOrderConfirmation,
					now);
			}
		}

		return new Response(
			JSON.stringify(
				{ received: true }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
	};