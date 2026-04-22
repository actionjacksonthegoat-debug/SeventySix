import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import type { CommerceDb } from "../cart";
import { now } from "../date.js";
import { orders, orderStatusHistory } from "../schema";
import type { OrderStatus } from "../types/db";
import { isNullOrEmpty, isPresent } from "../utils/null-check";
import type { PrintfulWebhookBody } from "./types";

/** Email notification callback for shipping updates. */
export type ShippingEmailClient = (
	email: string,
	orderId: string,
	trackingNumber: string,
	carrier: string) => Promise<void>;

/**
 * Builds a tracking URL for the given carrier and tracking number.
 * USPS gets a direct tracking link; all other carriers use Google search.
 */
export function getTrackingUrl(
	carrier: string,
	trackingNumber: string): string
{
	if (carrier.toLowerCase() === "usps")
	{
		return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
	}

	return `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${
		encodeURIComponent(trackingNumber)
	}`;
}

/**
 * Verifies the Printful webhook authorization token using timing-safe comparison.
 * Returns false if the token is missing, empty, or does not match.
 */
export function verifyPrintfulSignature(
	authorizationHeader: string | null,
	expectedSecret: string): boolean
{
	if (expectedSecret === "" || isNullOrEmpty(authorizationHeader))
	{
		return false;
	}

	const expectedToken: string =
		`Bearer ${expectedSecret}`;

	if (authorizationHeader.length !== expectedToken.length)
	{
		return false;
	}

	return timingSafeEqual(
		Buffer.from(authorizationHeader),
		Buffer.from(expectedToken));
}

/**
 * Handles a Printful webhook shipment update event.
 * Looks up the order by Printful order ID, updates status to "shipped",
 * records status history, and sends a shipping notification email.
 */
export async function handlePrintfulShipmentUpdate(
	db: CommerceDb,
	body: PrintfulWebhookBody,
	emailClient: ShippingEmailClient | null): Promise<{ received: boolean; }>
{
	if (body.type === "package_shipped")
	{
		const printfulOrderId: string =
			String(body.data?.order?.id ?? "");
		const trackingNumber: string =
			body.data?.shipment?.tracking_number ?? "";
		const carrier: string =
			body.data?.shipment?.carrier ?? "";

		if (printfulOrderId !== "")
		{
			const matchedOrders: { id: string; email: string; status: OrderStatus; }[] =
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

			if (matchedOrders.length > 0 && isPresent(matchedOrders[0]))
			{
				const order: { id: string; email: string; status: OrderStatus; } =
					matchedOrders[0];
				const trackingUrl: string =
					getTrackingUrl(carrier, trackingNumber);

				await db
					.update(orders)
					.set(
						{
							status: "shipped",
							fulfillmentChannel: "printful",
							shippingProvider: carrier,
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

				if (isPresent(emailClient))
				{
					await emailClient(
						order.email,
						order.id,
						trackingNumber,
						carrier);
				}
			}
		}
	}

	return { received: true };
}