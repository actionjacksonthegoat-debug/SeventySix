import { createPrintfulClient } from "@seventysixcommerce/shared/integrations";
import type { PrintfulClient } from "@seventysixcommerce/shared/integrations";

const printful: PrintfulClient =
	createPrintfulClient(
		{
			apiKey: process.env.PRINTFUL_API_KEY ?? "",
			mockServices: process.env.MOCK_SERVICES !== "false"
		});

/**
 * Creates a fulfillment order on Printful.
 * Called after successful Stripe payment webhook.
 */
export const createPrintfulOrder: PrintfulClient["createPrintfulOrder"] =
	printful.createPrintfulOrder;
