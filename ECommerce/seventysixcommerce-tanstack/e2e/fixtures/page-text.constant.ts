/**
 * Centralized UI text constants for E2E assertions.
 * Update here when UI copy changes — never hardcode text in specs.
 */
export const PAGE_TEXT = {
	titles: {
		home: /SeventySixCommerce/i,
		shop: /Shop/i,
		about: /About/i,
	},
	headings: {
		shop: "Shop",
		about: "About",
	},
	navigation: {
		home: "Home",
		shop: "Shop",
		about: "About",
	},
	errors: {
		notFound: "Page not found",
		serverError: "Something went wrong",
	},
} as const;
