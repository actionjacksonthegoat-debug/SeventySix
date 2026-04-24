// <copyright file="timeouts.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Centralized timeout values for E2E tests.
 * Adjust for CI vs local development as needed.
 */
type TimeoutsConfig = {
	element: number;
	api: number;
	navigation: number;
	email: number;
	auth: number;
	negativeTest: number;
	globalSetup: number;
	altchaSolve: number;
};

// CI environments (Docker + ubuntu-latest) are slower than local dev
const CI_MULTIPLIER: number =
	process.env["CI"] ? 1.5 : 1;

export const TIMEOUTS: TimeoutsConfig =
	{
	/**
	 * Standard element visibility timeout.
	 */
		element: 5000 * CI_MULTIPLIER,

		/**
	 * Extended timeout for API-dependent operations.
	 */
		api: 10000 * CI_MULTIPLIER,

		/**
	 * Navigation timeout for page loads.
	 */
		navigation: 15000 * CI_MULTIPLIER,

		/**
	 * Email delivery timeout via mock Brevo API.
	 * Extended to account for email queue processing interval.
	 */
		email: 15000 * CI_MULTIPLIER,

		/**
	 * Authentication flow timeout.
	 */
		auth: 10000 * CI_MULTIPLIER,

		/**
	 * Short timeout for negative test cases.
	 * Used when asserting something should NOT happen.
	 */
		negativeTest: 3000,

		/**
	 * Global setup timeout for authentication flow.
	 * Used during initial login before tests run.
	 */
		globalSetup: 30000 * CI_MULTIPLIER,

		/**
	 * Altcha proof-of-work challenge solve timeout.
	 * Widget transitions: unverified → verifying → verified.
	 */
		altchaSolve: 30000 * CI_MULTIPLIER
	} as const;