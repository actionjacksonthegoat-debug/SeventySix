import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { sendShippingNotification } from "$lib/server/integrations/brevo";
import { isNullOrEmpty } from "@seventysixcommerce/shared/utils";
import {
	handlePrintfulShipmentUpdate,
	printfulWebhookBodySchema,
	verifyPrintfulSignature
} from "@seventysixcommerce/shared/webhook";
import type { RequestHandler } from "./$types";

/**
 * Printful webhook handler for shipping notifications.
 * Delegates to shared library for auth verification, order updates,
 * and shipping email dispatch.
 */
export const POST: RequestHandler =
	async ({ request }) =>
	{
		const printfulWebhookSecret: string | undefined =
			env.PRINTFUL_WEBHOOK_SECRET;

		if (
			isNullOrEmpty(printfulWebhookSecret)
				|| !verifyPrintfulSignature(
					request.headers.get("authorization"),
					printfulWebhookSecret))
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
			return new Response(
				JSON.stringify(
					{ received: true }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" }
				});
		}

		const result: { received: boolean; } =
			await handlePrintfulShipmentUpdate(
				db,
				parsed.data,
				sendShippingNotification);

		return new Response(
			JSON.stringify(result),
			{
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
	};