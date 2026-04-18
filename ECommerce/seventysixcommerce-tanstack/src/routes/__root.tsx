import { createRootRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { JSX } from "react";
import { useEffect } from "react";
import { RootDocument } from "~/components/layout/RootDocument";
import { RootLayout } from "~/components/layout/RootLayout";
import { NotFoundPage } from "~/components/NotFoundPage";
import { trackPageView } from "~/lib/analytics";
import { THEME_COOKIE_NAME } from "~/lib/constants";
import { buildRootMeta } from "~/lib/root-meta";
import { initClientTelemetry, recordNavigation } from "~/lib/telemetry-client";
import globalsCss from "~/styles/globals.css?url";

/**
 * Server function that reads the theme cookie so SSR can render the correct CSS class.
 * Returns "dark" when the cookie is set to "dark", otherwise defaults to "light".
 */
const getServerTheme =
	createServerFn(
		{ method: "GET" })
		.handler(
			async (): Promise<string> =>
			{
				const value: string =
					getCookie(THEME_COOKIE_NAME) ?? "";

				return value === "dark" ? "dark" : "light";
			});

export const Route =
	createRootRoute(
		{
			beforeLoad: async () =>
			{
				const serverTheme: string =
					await getServerTheme();

				return { serverTheme };
			},
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

/** Root component wiring telemetry hooks and composing the document shell + layout. */
function RootComponent(): JSX.Element
{
	const router =
		useRouter();
	const { serverTheme } =
		Route.useRouteContext();

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
		<RootDocument serverTheme={serverTheme}>
			<RootLayout />
		</RootDocument>);
}