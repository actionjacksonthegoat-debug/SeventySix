/** Named route paths for E2E tests. */
export const ROUTES = {
	/** Application home page. */
	home: "/",
	/** About page. */
	about: "/about",
	/** Shop product listing. */
	shop: "/shop",
	/** Health check endpoint. */
	healthz: "/api/healthz",
	/** Terms of service page. */
	terms: "/terms",
	/** Privacy policy page. */
	privacy: "/privacy",
	/** Returns policy page. */
	returns: "/returns"
} as const;

/** Grouped routes for parameterized testing (e.g., accessibility scans). */
export const ROUTE_GROUPS = {
	/** All public pages that should be accessible. */
	publicPages: [
		ROUTES.home,
		ROUTES.about,
		ROUTES.shop,
		ROUTES.terms,
		ROUTES.privacy,
		ROUTES.returns,
	],
	/** Policy pages only. */
	policyPages: [
		ROUTES.terms,
		ROUTES.privacy,
		ROUTES.returns,
	],
} as const;
