import { BREVO_API_URL } from "../constants";

/** Configuration for the Brevo email service. */
export interface BrevoConfig
{
	/** Brevo API key. Empty string disables sending. */
	apiKey: string;
	/** Whether to use mock mode (log instead of send). */
	mockServices: boolean;
}

/** Brevo template IDs. */
export const BREVO_TEMPLATES: Readonly<{ ORDER_CONFIRMATION: number; SHIPPING_NOTIFICATION: number; }> =
	{
		ORDER_CONFIRMATION: 1,
		SHIPPING_NOTIFICATION: 2
	} as const;

/** Client interface returned by {@link createBrevoClient}. */
export interface BrevoClient
{
	/** Sends a transactional email via Brevo API. Never throws. */
	sendTransactionalEmail(
		to: string,
		templateId: number,
		params: Record<string, string>): Promise<void>;

	/** Sends an order confirmation email. */
	sendOrderConfirmation(
		email: string,
		orderNumber: string,
		total: string,
		itemCount: number): Promise<void>;

	/** Sends a shipping notification email with tracking info. */
	sendShippingNotification(
		email: string,
		orderNumber: string,
		trackingNumber: string,
		carrier: string): Promise<void>;
}

/**
 * Creates a Brevo email client with the given configuration.
 * Email failures are logged but never thrown — email must not block order processing.
 */
export function createBrevoClient(config: BrevoConfig): BrevoClient
{
	/**
	 * Sends a transactional email via Brevo API.
	 * Failures are logged but never thrown — email must not block order processing.
	 */
	async function sendTransactionalEmail(
		to: string,
		templateId: number,
		params: Record<string, string>): Promise<void>
	{
		if (config.mockServices)
		{
			const masked: string =
				to.replace(/^(.{2}).*@/, "$1***@");
			console.warn(
				`[Brevo Mock] Would send template ${templateId} to ${masked}`,
				params);
			return;
		}

		if (config.apiKey === "")
		{
			console.error("[Brevo] API key not configured — skipping email");
			return;
		}

		try
		{
			const response: Response =
				await fetch(
					BREVO_API_URL,
					{
						method: "POST",
						headers: {
							"api-key": config.apiKey,
							"Content-Type": "application/json"
						},
						body: JSON.stringify(
							{
								to: [{ email: to }],
								templateId,
								params
							})
					});

			if (!response.ok)
			{
				const maskedEmail: string =
					to.replace(/^(.{2}).*@/, "$1***@");
				console.error(
					`[Brevo] Email send failed (${response.status}) to ${maskedEmail}`);
			}
		}
		catch (error: unknown)
		{
			const maskedEmail: string =
				to.replace(/^(.{2}).*@/, "$1***@");
			console.error(
				`[Brevo] Email error for ${maskedEmail}:`,
				error instanceof Error ? error.message : "Unknown");
		}
	}

	/** Sends an order confirmation email. */
	async function sendOrderConfirmation(
		email: string,
		orderNumber: string,
		total: string,
		itemCount: number): Promise<void>
	{
		await sendTransactionalEmail(email, BREVO_TEMPLATES.ORDER_CONFIRMATION,
			{
				orderNumber,
				total: `$${total}`,
				itemCount: String(itemCount)
			});
	}

	/** Sends a shipping notification email with tracking info. */
	async function sendShippingNotification(
		email: string,
		orderNumber: string,
		trackingNumber: string,
		carrier: string): Promise<void>
	{
		await sendTransactionalEmail(email, BREVO_TEMPLATES.SHIPPING_NOTIFICATION,
			{
				orderNumber,
				trackingNumber,
				carrier
			});
	}

	return {
		sendTransactionalEmail,
		sendOrderConfirmation,
		sendShippingNotification
	};
}