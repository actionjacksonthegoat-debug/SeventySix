import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Creates the TanStack Router instance with file-based route tree. */
export function getRouter(): ReturnType<typeof createTanStackRouter>
{
	return createTanStackRouter(
		{
			routeTree,
			scrollRestoration: true
		});
}

declare module "@tanstack/react-router"
{
	interface Register
	{
		router: ReturnType<typeof getRouter>;
	}
}