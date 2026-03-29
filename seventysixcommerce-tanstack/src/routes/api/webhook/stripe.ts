import { createFileRoute } from "@tanstack/react-router";
import { handleStripeWebhook } from "~/server/functions/webhook";

/**
 * Stripe webhook endpoint.
 * Uses raw body for Stripe signature verification.
 * CSRF middleware is intentionally NOT applied; Stripe uses its own signature.
 */
export const Route =
	createFileRoute("/api/webhook/stripe")(
		{
			server: {
				handlers: {
					POST: async ({ request }): Promise<Response> =>
					{
						const rawBody: string =
							await request.text();
						const signature: string =
							request.headers.get("stripe-signature") ?? "";

						if (signature === "")
						{
							return new Response("Missing stripe-signature header",
								{
									status: 400
								});
						}

						try
						{
							const result: { received: boolean; } =
								await handleStripeWebhook(
									rawBody,
									signature);
							return Response.json(result);
						}
						catch (error: unknown)
						{
							const message: string =
								error instanceof Error
									? error.message
									: "Webhook processing failed";

							if (message === "Invalid webhook signature")
							{
								return new Response("Bad request",
									{ status: 400 });
							}

							return new Response("Webhook processing error",
								{
									status: 500
								});
						}
					}
				}
			}
		});