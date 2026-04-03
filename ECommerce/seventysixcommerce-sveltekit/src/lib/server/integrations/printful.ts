import { env } from "$env/dynamic/private";
import { createPrintfulClient } from "@seventysixcommerce/shared/integrations";
import type { PrintfulClient } from "@seventysixcommerce/shared/integrations";

export { PRINTFUL_STATUS_MAP } from "@seventysixcommerce/shared/integrations";
export type { PrintfulClient, PrintfulConfig } from "@seventysixcommerce/shared/integrations";
export type { OrderForFulfillment, PrintfulOrderResult, ShippingAddress } from "@seventysixcommerce/shared/types";

const printful: PrintfulClient =
	createPrintfulClient(
		{
			apiKey: env.PRINTFUL_API_KEY ?? "",
			mockServices: env.MOCK_SERVICES !== "false"
		});

/**
 * Creates a fulfillment order on Printful.
 * Called after successful Stripe payment webhook.
 */
export const createPrintfulOrder: PrintfulClient["createPrintfulOrder"] =
	printful.createPrintfulOrder;

/** Retrieves the current status of a Printful order. */
export const getPrintfulOrderStatus: PrintfulClient["getPrintfulOrderStatus"] =
	printful.getPrintfulOrderStatus;