/**
 * Framework-agnostic Stripe webhook orchestrator.
 * Handles signature verification and routes events to caller-supplied handlers.
 * Both SvelteKit and TanStack apps delegate to this module, injecting
 * their own handler maps and Stripe client.
 */

/** A single Stripe webhook event handler. */
export type WebhookHandler = (event: StripeEvent) => Promise<void>;

/** Map of Stripe event types to their respective handlers. */
export type WebhookHandlerMap = Partial<Record<string, WebhookHandler>>;

/**
 * Minimal Stripe client interface required by the orchestrator.
 * Only the `webhooks.constructEvent` method is needed for signature verification.
 */
export interface StripeWebhooksInterface
{
	/** Constructs and verifies a Stripe event from a raw request. */
	constructEvent: (
		payload: string | Buffer,
		signature: string,
		secret: string) => unknown;
}

/** Minimal Stripe client shape accepted by the orchestrator. */
export interface StripeClientInterface
{
	/** Webhook utilities. */
	webhooks: StripeWebhooksInterface;
}

/** Stripe event shape used internally by the orchestrator. */
export interface StripeEvent
{
	/** Unique event identifier. */
	id: string;
	/** Event type string (e.g. "checkout.session.completed"). */
	type: string;
	/** Event data payload. */
	data: { object: unknown; };
}

/** Input parameters for {@link processStripeWebhook}. */
export interface ProcessStripeWebhookInput
{
	/** Raw request body used for signature verification. */
	rawBody: Buffer | string;
	/** Value of the `stripe-signature` HTTP header. */
	signature: string;
	/** Webhook endpoint secret from environment. */
	secret: string;
	/** Stripe client (or compatible mock) used for signature verification. */
	stripe: StripeClientInterface;
	/** Map of event types to handler functions. */
	handlers: WebhookHandlerMap;
}

/** Result returned by {@link processStripeWebhook}. */
export interface ProcessStripeWebhookResult
{
	/**
	 * Outcome of processing:
	 * - `"processed"` — event was handled by a registered handler.
	 * - `"ignored"` — event type is not in the handler map; safely acknowledged.
	 * - `"invalid-signature"` — Stripe signature verification failed.
	 */
	status: "processed" | "ignored" | "invalid-signature";
	/**
	 * Stripe event ID.
	 * Present when `status` is `"processed"` or `"ignored"`.
	 */
	eventId?: string;
}

/**
 * Processes an incoming Stripe webhook request.
 *
 * @remarks
 * Security contract:
 * - Signature verification uses Stripe's timing-safe `constructEvent` method.
 * - The raw body is NEVER passed to any logger.
 * - Errors do NOT include the webhook secret in their message.
 * - Idempotency is delegated to the supplied handlers; the orchestrator
 *   invokes each handler exactly once per call.
 *
 * @param input - Webhook input including raw body, signature, secret, Stripe client, and handlers.
 * @returns A {@link ProcessStripeWebhookResult} describing the outcome.
 */
export async function processStripeWebhook(
	input: ProcessStripeWebhookInput): Promise<ProcessStripeWebhookResult>
{
	let event: StripeEvent;

	try
	{
		event =
			input.stripe.webhooks.constructEvent(
				input.rawBody,
				input.signature,
				input.secret) as StripeEvent;
	}
	catch
	{
		return { status: "invalid-signature" };
	}

	const handler: WebhookHandler | undefined =
		input.handlers[event.type];

	if (handler === undefined)
	{
		return { status: "ignored", eventId: event.id };
	}

	await handler(event);

	return { status: "processed", eventId: event.id };
}