import { z } from "zod";
import { PRINTFUL_API_BASE_URL } from "~/lib/constants";
import { now } from "~/lib/date";

/** Printful API response schema for order creation. */
const printfulOrderResponseSchema: z.ZodType<{ code: number; result: { id: number; status: string; }; }> =
	z.object(
		{
			code: z.number(),
			result: z.object(
				{
					id: z.number(),
					status: z.string()
				})
		});

/** Result from creating a Printful fulfillment order. */
export interface PrintfulOrderResult
{
	id: number;
	status: string;
}

/** Shipping address structure for Printful recipient. */
interface ShippingAddress
{
	line1?: string;
	city?: string;
	state?: string;
	postal_code?: string;
	country?: string;
}

/** Order with items needed for Printful submission. */
export interface OrderForFulfillment
{
	shippingName: string;
	shippingAddress: ShippingAddress;
	items: ReadonlyArray<{
		printfulSyncVariantId: string | null;
		quantity: number;
	}>;
}

/** Maps Printful status strings to our order status enum values. */
export const PRINTFUL_STATUS_MAP: Record<string, string> =
	{
		draft: "fulfilling",
		pending: "fulfilling",
		failed: "fulfillment_error",
		canceled: "cancelled",
		fulfilled: "shipped"
	};

/**
 * Creates a fulfillment order on Printful.
 * Called after successful Stripe payment webhook.
 */
export async function createPrintfulOrder(
	order: OrderForFulfillment,
	apiKey: string): Promise<PrintfulOrderResult>
{
	if (process.env.MOCK_SERVICES !== "false")
	{
		console.warn("[Printful Mock] Order created (simulated)");
		return {
			id: now()
				.getTime(),
			status: "draft"
		};
	}

	const fulfillableItems: Array<{ printfulSyncVariantId: string | null; quantity: number; }> =
		order.items.filter(
			(item) =>
				item.printfulSyncVariantId !== null);

	if (fulfillableItems.length === 0)
	{
		throw new Error(
			"No fulfillable items (missing Printful sync variant IDs)");
	}

	const response: Response =
		await fetch(`${PRINTFUL_API_BASE_URL}/orders`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify(
					{
						recipient: {
							name: order.shippingName,
							address1: order.shippingAddress.line1 ?? "",
							city: order.shippingAddress.city ?? "",
							state_code: order.shippingAddress.state ?? "",
							country_code: order.shippingAddress.country ?? "US",
							zip: order.shippingAddress.postal_code ?? ""
						},
						items: fulfillableItems.map((item) => ({
							sync_variant_id: item.printfulSyncVariantId,
							quantity: item.quantity
						}))
					})
			});

	if (!response.ok)
	{
		console.error(`[Printful] API error (${response.status})`);
		throw new Error(
			`Printful API error (${response.status})`);
	}

	const data: { code: number; result: { id: number; status: string; }; } =
		printfulOrderResponseSchema.parse(
			await response.json());
	return data.result;
}

/**
 * Retrieves the current status of a Printful order.
 */
export async function getPrintfulOrderStatus(
	printfulOrderId: string,
	apiKey: string): Promise<string>
{
	const response: Response =
		await fetch(
			`${PRINTFUL_API_BASE_URL}/orders/${encodeURIComponent(printfulOrderId)}`,
			{
				headers: { Authorization: `Bearer ${apiKey}` }
			});

	if (!response.ok)
	{
		throw new Error(`Printful API error (${response.status})`);
	}

	const statusData: { code: number; result: { id: number; status: string; }; } =
		printfulOrderResponseSchema.parse(
			await response.json());
	return PRINTFUL_STATUS_MAP[statusData.result.status] ?? "fulfilling";
}