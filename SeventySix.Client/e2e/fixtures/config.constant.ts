// <copyright file="config.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * E2E test environment configuration.
 * Centralizes URLs and environment-specific values.
 *
 * Port Allocation (isolated from development):
 * - API: 7174 (dev: 7074)
 * - Client: 4201 (dev: 4200)
 */
export const E2E_CONFIG =
	{
		/**
		 * Base URL for the Angular client.
		 */
		clientBaseUrl: "https://localhost:4201",

		/**
		 * Base URL for the API server (HTTPS for E2E).
		 */
		apiBaseUrl: "https://localhost:7174",

		/**
		 * MailDev web UI URL for email testing.
		 * HTTP only - no sensitive data.
		 */
		mailDevUrl: "http://localhost:1080"
	} as const;

/**
 * Cookie names used in E2E tests.
 */
export const COOKIE_NAMES =
	{
		refreshToken: "X-Refresh-Token"
	} as const;

/**
 * API route paths used in E2E tests for interception and direct calls.
 */
export const API_ROUTES =
	{
		auth:
			{
				login: "/api/v1/auth/login",
				totpVerify: "/api/v1/auth/mfa/totp/verify",
				totpDisable: "/api/v1/auth/mfa/totp/disable",
				trustedDevices: "/api/v1/auth/trusted-devices"
			},
		users:
			{
				me: "/api/v1/users/me",
				permissionRequests: "/api/v1/users/me/permission-requests"
			}
	} as const;
