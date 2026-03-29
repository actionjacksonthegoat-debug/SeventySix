import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { SITE_URL } from "~/lib/constants";

export const Route =
	createFileRoute("/returns")(
		{
			head: () => ({
				meta: [
					{ title: "Returns & Exchanges \u2014 SeventySixCommerce" },
					{
						name: "description",
						content: "SeventySixCommerce returns and exchange policy."
					},
					{
						property: "og:title",
						content: "Returns & Exchanges \u2014 SeventySixCommerce"
					},
					{
						property: "og:description",
						content: "SeventySixCommerce returns and exchange policy."
					},
					{ property: "og:type", content: "website" },
					{ property: "og:url", content: `${SITE_URL}/returns` },
					{ name: "twitter:card", content: "summary" }
				],
				links: [
					{ rel: "canonical", href: `${SITE_URL}/returns` }
				]
			}),
			component: ReturnsPage
		});

/** Returns & exchanges policy page. */
function ReturnsPage(): JSX.Element
{
	return (
		<main className="mx-auto max-w-3xl px-4 py-16">
			<h1 className="mb-6 text-3xl font-bold">Returns & Exchanges</h1>

			<h2 className="mb-3 mt-8 text-xl font-semibold">Our Policy</h2>
			<p className="mb-4 text-text-secondary">
				Because every item is custom printed just for you, we cannot accept returns for change of mind. However,
				we stand behind the quality of our products.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">
				Damaged or Defective Items
			</h2>
			<p className="mb-4 text-text-secondary">
				If your item arrives damaged or defective, contact us within 14 days of delivery. Include your order
				number and clear photos of the issue. We will send a replacement at no additional cost.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">Wrong Item</h2>
			<p className="mb-4 text-text-secondary">
				Received the wrong product? Let us know and we will ship the correct item immediately, on us.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">Contact</h2>
			<p className="text-text-secondary">
				Email us at support@SeventySixCommerce.store with your order number and we will make it right.
			</p>
		</main>);
}