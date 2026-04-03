import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { sendShippingNotification } from "~/lib/brevo";
import { now } from "~/lib/date";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

/**
 * Printful webhook handler for shipping notifications.
 * Updates order status and sends shipping email.
 * Verified via shared secret in Authorization header.
 */
export const Route =
	createFileRoute("/api/webhook/printful")(
		{
			server: {
				handlers: {
					POST: async ({ request }) =>
					{
						const authHeader: string =
							request.headers.get("authorization") ?? "";
						const webhookSecret: string =
							process.env.PRINTFUL_WEBHOOK_SECRET ?? "";
						const expectedToken: string =
							`Bearer ${webhookSecret}`;

						if (
							webhookSecret === ""
								|| authHeader.length !== expectedToken.length
								|| !timingSafeEqual(
									Buffer.from(authHeader),
									Buffer.from(expectedToken)))
						{
							return new Response("Unauthorized",
								{ status: 401 });
						}

						const body =
							await request.json();

						if (body?.type === "package_shipped")
						{
							const printfulOrderId: string =
								String(
									body.data?.order?.id ?? "");
							const trackingNumber: string =
								body.data?.shipment?.tracking_number ?? "";
							const carrier: string =
								body.data?.shipment?.carrier ?? "";

							if (printfulOrderId)
							{
							// Find our order by Printful order ID
								const orders =
									await db
										.select(
											{
												id: schema.orders.id,
												email: schema.orders.email,
												status: schema.orders.status
											})
										.from(schema.orders)
										.where(
											eq(
												schema.orders.printfulOrderId,
												printfulOrderId))
										.limit(1);

								if (orders.length > 0 && orders[0])
								{
									const order =
										orders[0];
									const trackingUrl: string =
										carrier.toLowerCase() === "usps"
											? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${
												encodeURIComponent(trackingNumber)
											}`
											: `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${
												encodeURIComponent(trackingNumber)
											}`;

									// Update order status to shipped
									await db
										.update(schema.orders)
										.set(
											{
												status: "shipped",
												trackingUrl,
												updatedAt: now()
											})
										.where(eq(schema.orders.id, order.id));

									// Record status change
									await db
										.insert(schema.orderStatusHistory)
										.values(
											{
												orderId: order.id,
												fromStatus: order.status,
												toStatus: "shipped",
												reason: `Shipped via ${carrier}, tracking: ${trackingNumber}`
											});

									// Send shipping notification email (non-blocking)
									await sendShippingNotification(
										order.email,
										order.id,
										trackingNumber,
										carrier);
								}
							}
						}

						return Response.json(
							{ received: true });
					}
				}
			}
		});