import { createBrevoClient } from "@seventysixcommerce/shared/integrations";
import type { BrevoClient } from "@seventysixcommerce/shared/integrations";

const brevo: BrevoClient =
	createBrevoClient(
		{
			apiKey: process.env.BREVO_API_KEY ?? "",
			mockServices: process.env.MOCK_SERVICES !== "false"
		});

/** Sends an order confirmation email. */
export const sendOrderConfirmation: BrevoClient["sendOrderConfirmation"] =
	brevo.sendOrderConfirmation;

/** Sends a shipping notification email with tracking info. */
export const sendShippingNotification: BrevoClient["sendShippingNotification"] =
	brevo.sendShippingNotification;