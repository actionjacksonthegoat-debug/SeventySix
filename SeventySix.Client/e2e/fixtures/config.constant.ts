// <copyright file="config.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * E2E test environment configuration.
 * Centralizes URLs and environment-specific values.
 */
export const E2E_CONFIG =
	{
		/**
		 * Base URL for the Angular client.
		 */
		clientBaseUrl: "http://localhost:4200",

		/**
		 * Base URL for the API server (HTTP for E2E).
		 */
		apiBaseUrl: "http://localhost:5086",

		/**
		 * MailDev web UI URL for email testing.
		 */
		mailDevUrl: "http://localhost:1080"
	} as const;
