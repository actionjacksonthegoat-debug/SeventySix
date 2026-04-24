import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { sendOrderConfirmation } from "$lib/server/integrations/brevo";
import { createPrintfulOrder } from "$lib/server/integrations/printful";
import { queueLog } from "$lib/server/log-forwarder";
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
import type { RequestHandler } from "./$types";

/**
 * Stripe webhook handler.
 * CSRF not required — Stripe uses signature verification.
 */
export const POST: RequestHandler =
	async ({ request }) =>
	{
		const secret: string | undefined =
			env.STRIPE_WEBHOOK_SECRET;
		if (isNullOrEmpty(secret))
		{
			queueLog(
				{
					logLevel: "Error",
					message: "STRIPE_WEBHOOK_SECRET is not configured — rejecting webhook"
				});

			return new Response(
				"Webhook secret not configured",
				{ status: 500 });
		}

		const payload: string =
			await request.text();
		const signature: string =
			request.headers.get("stripe-signature") ?? "";

		const stripe: StripeClient =
			getStripe(
				{
					secretKey: env.STRIPE_SECRET_KEY,
					useMocks: env.MOCK_SERVICES !== "false",
					baseUrl: env.BASE_URL ?? ""
				});

		const result: ProcessStripeWebhookResult =
			await processStripeWebhook(
				{
					rawBody: payload,
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
									env.PRINTFUL_API_KEY ?? "";

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
			return new Response("Invalid signature",
				{ status: 400 });
		}

		return new Response(
			JSON.stringify(
				{ received: true }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
	};