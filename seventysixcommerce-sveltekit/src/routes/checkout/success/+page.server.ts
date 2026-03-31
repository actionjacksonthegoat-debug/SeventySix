import { queueLog } from "$lib/server/log-forwarder";
import { recordPageView } from "$lib/server/metrics";
import { getStripe } from "$lib/server/stripe";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const STRIPE_SESSION_PATTERN: RegExp =
	/^cs_(test_|live_)[a-zA-Z0-9]+$/;

/** Loads order confirmation details from the Stripe session. */
export const load: PageServerLoad =
	async ({ url, locals }) =>
	{
		recordPageView("checkout-success");
		queueLog(
			{
				logLevel: "Information",
				message: "Page view: checkout-success"
			});

		const sessionId: string =
			url.searchParams.get("session_id") ?? "";

		if (sessionId === "" || !STRIPE_SESSION_PATTERN.test(sessionId))
		{
			error(400, "Missing or invalid session ID");
		}

		const stripe =
			getStripe();
		const session =
			(await stripe.checkout.sessions.retrieve(
				sessionId)) as unknown as import("stripe").default.Checkout.Session;

		// Verify session belongs to the current cart session
		if (session.metadata?.cartSessionId !== locals.cartSessionId)
		{
			error(403, "Access denied");
		}

		if (session.payment_status !== "paid")
		{
			error(400, "Payment not completed");
		}

		return {
			orderId: session.id,
			email: session.customer_details?.email ?? "",
			total: (session.amount_total ?? 0) / 100,
			items: session.line_items?.data.map((item) => ({
				name: item.description,
				quantity: item.quantity,
				amount: (item.amount_total ?? 0) / 100
			})) ?? []
		};
	};