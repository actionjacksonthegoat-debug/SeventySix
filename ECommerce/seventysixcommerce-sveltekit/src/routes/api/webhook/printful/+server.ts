import { env } from "$env/dynamic/private";
import { db } from "$lib/server/db";
import { orders, orderStatusHistory } from "$lib/server/db/schema";
import { sendShippingNotification } from "$lib/server/integrations/brevo";
import { now } from "$lib/utils/date";
import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "./$types";

/**
 * Printful webhook handler for shipping notifications.
 * Updates order status and sends shipping email.
 * Verified via shared secret in Authorization header.
 */
export const POST: RequestHandler =
	async ({ request }) =>
	{
		const printfulWebhookSecret: string | undefined =
			env.PRINTFUL_WEBHOOK_SECRET;
		const authHeader: string =
			request.headers.get("authorization") ?? "";
		const expectedToken: string =
			`Bearer ${printfulWebhookSecret ?? ""}`;
		if (
			printfulWebhookSecret === undefined
				|| printfulWebhookSecret === ""
				|| authHeader.length !== expectedToken.length
				|| !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedToken)))
		{
			return new Response("Unauthorized",
				{ status: 401 });
		}

		const body =
			await request.json();

		if (body?.type === "package_shipped")
		{
			const printfulOrderId: string =
				String(body.data?.order?.id ?? "");
			const trackingNumber: string =
				body.data?.shipment?.tracking_number ?? "";
			const carrier: string =
				body.data?.shipment?.carrier ?? "";

			if (printfulOrderId)
			{
				const matchedOrders =
					await db
						.select(
							{
								id: orders.id,
								email: orders.email,
								status: orders.status
							})
						.from(orders)
						.where(eq(orders.printfulOrderId, printfulOrderId))
						.limit(1);

				if (matchedOrders.length > 0 && matchedOrders[0])
				{
					const order =
						matchedOrders[0];
					const trackingUrl: string =
						carrier.toLowerCase() === "usps"
							? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`
							: `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${
								encodeURIComponent(trackingNumber)
							}`;

					await db
						.update(orders)
						.set(
							{
								status: "shipped",
								trackingUrl,
								updatedAt: now()
							})
						.where(eq(orders.id, order.id));

					await db
						.insert(orderStatusHistory)
						.values(
							{
								orderId: order.id,
								fromStatus: order.status,
								toStatus: "shipped",
								reason: `Shipped via ${carrier}, tracking: ${trackingNumber}`
							});

					await sendShippingNotification(
						order.email,
						order.id,
						trackingNumber,
						carrier);
				}
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