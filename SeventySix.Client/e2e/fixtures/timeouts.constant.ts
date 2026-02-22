// <copyright file="timeouts.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Centralized timeout values for E2E tests.
 * Adjust for CI vs local development as needed.
 */
export const TIMEOUTS =
	{
		/**
		 * Standard element visibility timeout.
		 */
		element: 5000,

		/**
		 * Extended timeout for API-dependent operations.
		 */
		api: 10000,

		/**
		 * Navigation timeout for page loads.
		 */
		navigation: 15000,

		/**
		 * Email delivery timeout via MailDev.
		 * Extended to account for email queue processing interval.
		 */
		email: 15000,

		/**
		 * Authentication flow timeout.
		 */
		auth: 10000,

		/**
		 * Short timeout for negative test cases.
		 * Used when asserting something should NOT happen.
		 */
		negativeTest: 3000,

		/**
		 * Global setup timeout for authentication flow.
		 * Used during initial login before tests run.
		 */
		globalSetup: 30000,

		/**
		 * Altcha proof-of-work challenge solve timeout.
		 * Widget transitions: unverified → verifying → verified.
		 */
		altchaSolve: 30000
	} as const;
