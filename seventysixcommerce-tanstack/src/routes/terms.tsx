import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { SITE_URL } from "~/lib/constants";

export const Route =
	createFileRoute("/terms")(
		{
			head: () => ({
				meta: [
					{ title: "Terms of Service \u2014 SeventySixCommerce" },
					{
						name: "description",
						content: "SeventySixCommerce terms of service."
					},
					{
						property: "og:title",
						content: "Terms of Service \u2014 SeventySixCommerce"
					},
					{
						property: "og:description",
						content: "SeventySixCommerce terms of service."
					},
					{ property: "og:type", content: "website" },
					{ property: "og:url", content: `${SITE_URL}/terms` },
					{ name: "twitter:card", content: "summary" }
				],
				links: [
					{ rel: "canonical", href: `${SITE_URL}/terms` }
				]
			}),
			component: TermsPage
		});

/** Terms of service page. */
function TermsPage(): JSX.Element
{
	return (
		<main className="mx-auto max-w-3xl px-4 py-16">
			<h1 className="mb-6 text-3xl font-bold">Terms of Service</h1>
			<p className="mb-4 text-text-secondary">Last updated: 2026</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">
				Orders & Payment
			</h2>
			<p className="mb-4 text-text-secondary">
				All payments are processed securely through Stripe. Prices are in USD and include applicable taxes where
				required. Orders are confirmed via email after successful payment.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">Shipping</h2>
			<p className="mb-4 text-text-secondary">
				Products are printed on demand by our fulfillment partner (Printful) and typically ship within 3-7
				business days. Tracking information is provided via email once your order ships.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">
				Returns & Refunds
			</h2>
			<p className="mb-4 text-text-secondary">
				Due to the custom, made-to-order nature of our products, we accept returns only for defective or damaged
				items. Please contact us within 14 days of delivery with photos of the issue.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">
				Intellectual Property
			</h2>
			<p className="text-text-secondary">
				All artwork and designs are original works. Reproduction, redistribution, or commercial use of our
				artwork without written permission is prohibited.
			</p>
		</main>);
}