import { currentYear } from "@seventysixcommerce/shared/date";
import { Outlet } from "@tanstack/react-router";
import type { JSX } from "react";
import { CartBadge } from "~/components/ui/CartBadge";
import { CookieConsent } from "~/components/ui/CookieConsent";
import { ThemeToggle } from "~/components/ui/ThemeToggle";

/** Root shell layout component rendering the full page: header, nav, main outlet, and footer. */
export function RootLayout(): JSX.Element
{
	return (
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
						<a href="/privacy">Privacy</a>
						<a href="/terms">Terms</a>
						<a href="/returns">Returns</a>
					</div>
					<p className="mt-4 text-xs text-text-muted">
						&copy; {currentYear()} SeventySixCommerce. All rights reserved.
					</p>
				</div>
			</footer>
			<CookieConsent measurementId={import.meta.env.VITE_GA4_MEASUREMENT_ID ?? ""} />
		</div>);
}