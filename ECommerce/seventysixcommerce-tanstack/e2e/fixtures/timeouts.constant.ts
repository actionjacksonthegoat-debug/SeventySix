/**
 * CI-aware timeout constants for E2E tests.
 * CI environments (ubuntu-latest) are slower — apply a multiplier.
 */
const CI_MULTIPLIER: number = process.env.CI ? 1.5 : 1;

export const TIMEOUTS = {
	/** Wait for an element to appear */
	element: 5_000 * CI_MULTIPLIER,
	/** Wait for an API response */
	api: 10_000 * CI_MULTIPLIER,
	/** Wait for a page navigation */
	navigation: 15_000 * CI_MULTIPLIER,
	/** Negative assertion — element should NOT appear */
	negativeTest: 3_000,
} as const;
