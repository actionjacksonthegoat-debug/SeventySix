import {
	handlePrintfulShipmentUpdate,
	printfulWebhookBodySchema,
	verifyPrintfulSignature
} from "@seventysixcommerce/shared/webhook";
import { createFileRoute } from "@tanstack/react-router";
import { sendShippingNotification } from "~/lib/brevo";
import { db } from "~/server/db";

/**
 * Printful webhook handler for shipping notifications.
 * Delegates to shared library for auth verification, order updates,
 * and shipping email dispatch.
 */
export const Route =
	createFileRoute("/api/webhook/printful")(
		{
			server: {
				handlers: {
					POST: async ({ request }) =>
					{
						const webhookSecret: string =
							process.env.PRINTFUL_WEBHOOK_SECRET ?? "";

						if (
							webhookSecret === ""
								|| !verifyPrintfulSignature(
									request.headers.get("authorization"),
									webhookSecret))
						{
							return new Response("Unauthorized",
								{ status: 401 });
						}

						const rawBody: unknown =
							await request.json();
						const parsed =
							printfulWebhookBodySchema.safeParse(rawBody);

						if (!parsed.success)
						{
							return Response.json(
								{ received: true });
						}

						const result: { received: boolean; } =
							await handlePrintfulShipmentUpdate(
								db,
								parsed.data,
								sendShippingNotification);

						return Response.json(result);
					}
				}
			}
		});