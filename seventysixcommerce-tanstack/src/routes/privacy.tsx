import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { SITE_URL } from "~/lib/constants";

export const Route =
	createFileRoute("/privacy")(
		{
			head: () => ({
				meta: [
					{ title: "Privacy Policy \u2014 SeventySixCommerce" },
					{
						name: "description",
						content: "SeventySixCommerce privacy policy \u2014 how we handle your data."
					},
					{
						property: "og:title",
						content: "Privacy Policy \u2014 SeventySixCommerce"
					},
					{
						property: "og:description",
						content: "SeventySixCommerce privacy policy \u2014 how we handle your data."
					},
					{ property: "og:type", content: "website" },
					{ property: "og:url", content: `${SITE_URL}/privacy` },
					{ name: "twitter:card", content: "summary" }
				],
				links: [
					{ rel: "canonical", href: `${SITE_URL}/privacy` }
				]
			}),
			component: PrivacyPage
		});

/** Privacy policy page. */
function PrivacyPage(): JSX.Element
{
	return (
		<main className="mx-auto max-w-3xl px-4 py-16">
			<h1 className="mb-6 text-3xl font-bold">Privacy Policy</h1>
			<p className="mb-4 text-text-secondary">Last updated: 2026</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">
				Information We Collect
			</h2>
			<p className="mb-4 text-text-secondary">
				We collect your email address and shipping information when you place an order. Payment processing is
				handled entirely by Stripe — we never see or store your card details.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">
				How We Use Your Data
			</h2>
			<p className="mb-4 text-text-secondary">
				Your data is used solely to fulfill your order and send shipping notifications. We do not sell, rent, or
				share your personal information with third parties except as required to complete your order (Printful
				for fulfillment, Brevo for email notifications).
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">Cookies</h2>
			<p className="mb-4 text-text-secondary">
				We use a session cookie for your shopping cart and a CSRF protection cookie. No tracking cookies are
				used.
			</p>

			<h2 className="mb-3 mt-8 text-xl font-semibold">Contact</h2>
			<p className="text-text-secondary">
				Questions about your data? Email us at privacy@SeventySixCommerce.store
			</p>
		</main>);
}