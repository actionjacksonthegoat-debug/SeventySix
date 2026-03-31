import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { JSX } from "react";
import type Stripe from "stripe";
import { z } from "zod";
import { getStripe } from "~/server/lib/stripe";
import { queueLog } from "~/server/log-forwarder";
import { recordPageView } from "~/server/metrics";
import { cartSessionMiddleware } from "~/server/middleware/cart-session";

/** Order confirmation details shown on the success page. */
interface OrderConfirmation
{
	email: string;
	amountTotal: string;
	shippingName: string | null;
}

/** Retrieves order confirmation details from a Stripe checkout session. */
const getOrderConfirmation =
	createServerFn(
		{ method: "GET" })
		.middleware(
			[cartSessionMiddleware])
		.inputValidator(z.object(
			{
				sessionId: z
					.string()
					.regex(/^cs_(test_|live_)[a-zA-Z0-9]+$/)
			}))
		.handler(
			async ({ data, context }): Promise<OrderConfirmation | null> =>
			{
				try
				{
					const session =
						(await getStripe().checkout.sessions.retrieve(
							data.sessionId)) as unknown as Stripe.Checkout.Session;

					// Ownership check — verify this session belongs to the current cart
					if (session.metadata?.cartSessionId !== context.cartSessionId)
					{
						return null;
					}

					return {
						email: session.customer_details?.email ?? "",
						amountTotal: ((session.amount_total ?? 0) / 100).toFixed(2),
						shippingName: session.collected_information?.shipping_details?.name
							?? null
					};
				}
				catch
				{
					return null;
				}
			});

export const Route =
	createFileRoute("/checkout/success")(
		{
			head: () => ({
				meta: [
					{ title: "Order Confirmed — SeventySixCommerce" },
					{ name: "robots", content: "noindex" }
				]
			}),
			validateSearch: z.object(
				{
					session_id: z
						.string()
						.regex(/^cs_(test_|live_)[a-zA-Z0-9]+$/)
						.optional()
				}),
			loaderDeps: ({ search }) => ({ sessionId: search.session_id }),
			loader: async ({ deps }) =>
			{
				recordPageView("checkout-success");
				queueLog(
					{
						logLevel: "Information",
						message: "Page view: checkout-success"
					});

				if (deps.sessionId === undefined)
				{
					return { confirmation: null };
				}

				const confirmation =
					await getOrderConfirmation(
						{
							data: { sessionId: deps.sessionId }
						});

				return { confirmation };
			},
			component: SuccessPage
		});

function SuccessPage(): JSX.Element
{
	const { confirmation } =
		Route.useLoaderData();

	if (confirmation === null)
	{
		return (
			<div className="max-w-md mx-auto px-4 py-16 text-center">
				<h1 className="text-xl font-semibold text-text-primary mb-4">
					Something went wrong
				</h1>
				<p className="text-text-muted mb-6">
					We couldn't find your order details. If you completed payment, your order has been received and
					you'll get a confirmation email shortly.
				</p>
				<a
					href="/"
					className="inline-block bg-text-primary text-bg-primary py-3 px-6 rounded-lg hover:bg-text-primary transition-colors"
				>
					Continue Shopping
				</a>
			</div>);
	}

	return (
		<div className="max-w-md mx-auto px-4 py-16 text-center">
			<div className="text-5xl mb-4" aria-hidden="true">
				✓
			</div>
			<h1 className="text-2xl font-bold text-text-primary mb-2">
				Order Confirmed!
			</h1>
			<p className="text-text-secondary mb-6">
				Thank you for your purchase
				{confirmation.shippingName
					? `, ${confirmation.shippingName}`
					: ""}
				! A confirmation email has been sent to <strong>{confirmation.email}</strong>.
			</p>

			<div className="bg-bg-secondary rounded-lg p-6 mb-8 text-left">
				<h2 className="font-semibold text-text-primary mb-3">
					Order Summary
				</h2>
				<div className="space-y-2 text-sm">
					<div className="flex justify-between">
						<span className="text-text-secondary">Total Paid</span>
						<span className="font-medium text-text-primary">
							${confirmation.amountTotal}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-text-secondary">
							Confirmation Email
						</span>
						<span className="text-text-primary">
							{confirmation.email}
						</span>
					</div>
				</div>
			</div>

			<a
				href="/"
				className="inline-block bg-text-primary text-bg-primary py-3 px-6 rounded-lg hover:bg-text-primary transition-colors font-medium"
			>
				Continue Shopping
			</a>
		</div>);
}