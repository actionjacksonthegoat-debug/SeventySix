import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
	useRouter
} from "@tanstack/react-router";
import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { CookieConsent } from "~/components/ui/CookieConsent";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import { ThemeProvider } from "~/context/theme-context";
import { trackPageView } from "~/lib/analytics";
import { currentYear } from "~/lib/date";
import { initClientTelemetry, recordNavigation } from "~/lib/telemetry-client";
import { getCart } from "~/server/functions/cart";
import globalsCss from "~/styles/globals.css?url";

/** Inline script that prevents FOUC by applying the dark class before paint. */
const FOUC_SCRIPT: string =
	`(function(){var t=localStorage.getItem("SeventySixCommerce-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}if(t==="dark"){document.documentElement.classList.add("dark")}})();`;

/** Returns the base meta tags including optional Google Site Verification. */
function buildRootMeta(): Array<Record<string, string>>
{
	const meta: Array<Record<string, string>> =
		[
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "SeventySixCommerce — Original Art on Everyday Things" },
			{
				name: "description",
				content: "Discover unique art merchandise — t-shirts, posters, mugs and more featuring original artwork."
			}
		];

	const siteVerification: string =
		import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? "";

	if (siteVerification.length > 0)
	{
		meta.push(
			{
				name: "google-site-verification",
				content: siteVerification
			});
	}

	const bingVerification: string =
		import.meta.env.VITE_BING_SITE_VERIFICATION ?? "";

	if (bingVerification.length > 0)
	{
		meta.push(
			{
				name: "msvalidate.01",
				content: bingVerification
			});
	}

	return meta;
}

export const Route =
	createRootRoute(
		{
			notFoundComponent: NotFoundPage,
			head: () => ({
				meta: buildRootMeta(),
				links: [
					{ rel: "icon", href: "/favicon.ico" },
					{ rel: "icon", href: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
					{ rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
					{ rel: "stylesheet", href: globalsCss }
				]
			}),
			component: RootComponent
		});

/** Root layout component rendering the full page shell: header, nav, main, and footer. */
function RootComponent(): JSX.Element
{
	const router =
		useRouter();

	useEffect(
		() =>
		{
			initClientTelemetry(import.meta.env.VITE_OTEL_ENDPOINT ?? "");
		},
		[]);

	useEffect(
		() =>
		{
			const unsubscribe: () => void =
				router.subscribe("onResolved",
					(event) =>
					{
						recordNavigation(event.toLocation.pathname);
						trackPageView(event.toLocation.pathname, document.title);
					});
			return unsubscribe;
		},
		[router]);

	return (
		<RootDocument>
			<div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
				{import.meta.env.VITE_MOCK_SERVICES === "true" && (
					<div className="bg-amber-500 text-center py-1 text-sm font-medium text-amber-950">
						Demo Mode — No real transactions are processed
					</div>)}
				<header className="bg-bg-primary border-b border-border">
					<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
						<a href="/" className="text-xl font-bold text-text-primary">
							SeventySixCommerce
						</a>
						<div className="flex items-center gap-6">
							<a
								href="/shop"
								className="text-text-secondary hover:text-text-primary"
							>
								Shop
							</a>
							<a
								href="/cart"
								className="relative text-text-secondary hover:text-text-primary"
							>
								Cart
								<CartBadge />
							</a>
							<ThemeToggle />
						</div>
					</nav>
				</header>

				<main className="flex-1">
					<Outlet />
				</main>

				<footer className="bg-bg-secondary border-t border-border py-8">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex flex-wrap gap-6 text-sm text-text-muted">
							<a href="/about">About</a>
							<a href="/policies/privacy">Privacy</a>
							<a href="/policies/terms">Terms</a>
							<a href="/policies/returns">Returns</a>
						</div>
						<p className="mt-4 text-xs text-text-muted">
							&copy; {currentYear()} SeventySixCommerce. All rights reserved.
						</p>
					</div>
				</footer>
				<CookieConsent measurementId={import.meta.env.VITE_GA4_MEASUREMENT_ID ?? ""} />
			</div>
		</RootDocument>);
}

/** HTML document wrapper providing `<html>`, `<head>`, and `<body>` with FOUC prevention. */
function RootDocument({
	children
}: Readonly<{ children: ReactNode; }>): JSX.Element
{
	return (
		<html lang="en">
			<head>
				<script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					{children}
				</ThemeProvider>
				<Scripts />
			</body>
		</html>);
}

/** Cart badge that shows item count in the navigation. */
function CartBadge(): JSX.Element | null
{
	const [count, setCount] =
		useState<number>(0);

	useEffect(
		() =>
		{
			getCart()
				.then((cart) => setCount(cart.itemCount))
				.catch(() => setCount(0));
		},
		[]);

	if (count === 0)
	{
		return null;
	}

	return (
		<span className="absolute -top-2 -right-3 bg-text-primary text-bg-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
			{count > 99 ? "99+" : count}
		</span>);
}

/** Rendered when no route matches. */
function NotFoundPage(): JSX.Element
{
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
			<h1 className="mb-4 text-4xl font-bold text-text-primary">404</h1>
			<p className="mb-8 text-text-muted">
				The page you&apos;re looking for doesn&apos;t exist.
			</p>
			<a
				href="/"
				className="text-text-primary underline hover:no-underline"
			>
				Return home
			</a>
		</div>);
}