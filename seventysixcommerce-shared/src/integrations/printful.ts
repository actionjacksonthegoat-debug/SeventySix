import { z } from "zod";
import { DEFAULT_COUNTRY, PRINTFUL_API_BASE_URL } from "../constants";
import { now } from "../date";
import type { OrderForFulfillment, PrintfulOrderResult } from "../types";

/** Configuration for the Printful fulfillment service. */
export interface PrintfulConfig
{
	/** Printful API key. */
	apiKey: string;
	/** Whether to use mock mode (simulate instead of call API). */
	mockServices: boolean;
}

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

/** Maps Printful status strings to our order status enum values. */
export const PRINTFUL_STATUS_MAP: Record<string, string> =
	{
		draft: "fulfilling",
		pending: "fulfilling",
		failed: "fulfillment_error",
		canceled: "cancelled",
		fulfilled: "shipped"
	};

/** Client interface returned by {@link createPrintfulClient}. */
export interface PrintfulClient
{
	/** Creates a fulfillment order on Printful. */
	createPrintfulOrder(
		order: OrderForFulfillment): Promise<PrintfulOrderResult>;

	/** Retrieves the current status of a Printful order. */
	getPrintfulOrderStatus(
		printfulOrderId: string): Promise<string>;
}

/**
 * Creates a Printful fulfillment client with the given configuration.
 * Called after successful Stripe payment webhook.
 */
export function createPrintfulClient(config: PrintfulConfig): PrintfulClient
{
	/**
	 * Creates a fulfillment order on Printful.
	 * Called after successful Stripe payment webhook.
	 */
	async function createPrintfulOrder(
		order: OrderForFulfillment): Promise<PrintfulOrderResult>
	{
		if (config.mockServices)
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
						Authorization: `Bearer ${config.apiKey}`,
						"Content-Type": "application/json"
					},
					body: JSON.stringify(
						{
							recipient: {
								name: order.shippingName,
								address1: order.shippingAddress.line1 ?? "",
								city: order.shippingAddress.city ?? "",
								state_code: order.shippingAddress.state ?? "",
								country_code: order.shippingAddress.country ?? DEFAULT_COUNTRY,
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
	async function getPrintfulOrderStatus(
		printfulOrderId: string): Promise<string>
	{
		const response: Response =
			await fetch(
				`${PRINTFUL_API_BASE_URL}/orders/${encodeURIComponent(printfulOrderId)}`,
				{
					headers: { Authorization: `Bearer ${config.apiKey}` }
				});

		if (!response.ok)
		{
			throw new Error(`Printful API error (${response.status})`);
		}

		const statusData: { code: number; result: { id: number; status: string; }; } =
			printfulOrderResponseSchema
				.parse(
					await response.json());
		return PRINTFUL_STATUS_MAP[statusData.result.status] ?? "fulfilling";
	}

	return {
		createPrintfulOrder,
		getPrintfulOrderStatus
	};
}