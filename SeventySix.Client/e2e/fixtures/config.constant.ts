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
type E2eConfig = {
	clientBaseUrl: string;
	apiBaseUrl: string;
	mailDevUrl: string;
	totpTimeStepSeconds: number;
};

export const E2E_CONFIG: E2eConfig =
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
		mailDevUrl: "http://localhost:1080",

		/**
	 * TOTP time step in seconds.
	 * Must match Totp:TimeStepSeconds in the E2E API config.
	 * E2E uses 10s (vs 30s production) to reduce TOTP wait times.
	 */
		totpTimeStepSeconds: 10
	} as const;

/**
 * Cookie names used in E2E tests.
 */
type CookieNames = {
	refreshToken: string;
};

export const COOKIE_NAMES: CookieNames =
	{
		refreshToken: "X-Refresh-Token"
	} as const;

/**
 * API route paths used in E2E tests for interception and direct calls.
 */
type ApiRoutes = {
	auth: {
		login: string;
		totpVerify: string;
		totpDisable: string;
		trustedDevices: string;
	};
	users: {
		me: string;
		permissionRequests: string;
	};
};

export const API_ROUTES: ApiRoutes =
	{
		auth: {
			login: "/api/v1/auth/login",
			totpVerify: "/api/v1/auth/mfa/totp/verify",
			totpDisable: "/api/v1/auth/mfa/totp/disable",
			trustedDevices: "/api/v1/auth/trusted-devices"
		},
		users: {
			me: "/api/v1/users/me",
			permissionRequests: "/api/v1/users/me/permission-requests"
		}
	} as const;