/** DOM selectors for E2E tests. */
export const SELECTORS = {
	/** Page header element. */
	header: "header",
	/** Page footer element. */
	footer: "footer",
	/** Main content area. */
	mainContent: "main",
	/** Primary navigation. */
	navigation: "nav",
	/** Product grid container. */
	shopGrid: "[data-testid='product-grid']",
	/** Navigation link to the about page. */
	navAbout: "a[href='/about']",
	/** Navigation link to the shop page. */
	navShop: "a[href='/shop']",
	/** Navigation link to the home page. */
	navHome: "a[href='/']",
} as const;
