// <copyright file="routes.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Application-wide route path constants.
 * Centralized routing eliminates hardcoded strings.
 */
export const APP_ROUTES: Readonly<{
	HOME: "/";
	AUTH: {
		LOGIN: "/auth/login";
		REGISTER: "/auth/register";
		FORGOT_PASSWORD: "/auth/forgot-password";
		RESET_PASSWORD: "/auth/reset-password";
		MFA_VERIFY: "/auth/mfa/verify";
	};
	ACCOUNT: {
		PROFILE: "/account/profile";
		SETTINGS: "/account/settings";
	};
	ERROR: {
		NOT_FOUND: "/error/404";
		UNAUTHORIZED: "/error/401";
		FORBIDDEN: "/error/403";
	};
}> =
	{
	/** Home/root route. */
		HOME: "/",
		/** Authentication routes. */
		AUTH: {
			LOGIN: "/auth/login",
			REGISTER: "/auth/register",
			FORGOT_PASSWORD: "/auth/forgot-password",
			RESET_PASSWORD: "/auth/reset-password",
			MFA_VERIFY: "/auth/mfa/verify"
		},
		/** Account management routes. */
		ACCOUNT: {
			PROFILE: "/account/profile",
			SETTINGS: "/account/settings"
		},
		/** Error page routes. */
		ERROR: {
			NOT_FOUND: "/error/404",
			UNAUTHORIZED: "/error/401",
			FORBIDDEN: "/error/403"
		}
	} as const;
