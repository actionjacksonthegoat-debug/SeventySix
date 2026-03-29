import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";

export const Route =
	createFileRoute("/checkout/")(
		{
			head: () => ({
				meta: [
					{ title: "Checkout — SeventySixCommerce" },
					{ name: "robots", content: "noindex" }
				]
			}),
			component: CheckoutPage
		});

/** Redirect page — checkout is now initiated from the cart page. */
function CheckoutPage(): JSX.Element
{
	return (
		<div className="max-w-md mx-auto px-4 py-16 text-center">
			<h1 className="text-xl font-semibold text-text-primary mb-4">
				Checkout
			</h1>
			<p className="text-text-muted mb-6">
				Please use the checkout button on your cart page to start checkout.
			</p>
			<a
				href="/cart"
				className="inline-block bg-text-primary text-bg-primary py-3 px-6 rounded-lg hover:bg-text-primary transition-colors font-medium"
			>
				Go to Cart
			</a>
		</div>);
}