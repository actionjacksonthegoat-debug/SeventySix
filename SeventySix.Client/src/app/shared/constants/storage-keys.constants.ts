// <copyright file="storage-keys.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Centralized storage key constants.
 * Prevents key collisions and enables easy refactoring.
 */
export const STORAGE_KEYS: Readonly<{
	/** Authentication: session marker in localStorage. */
	AUTH_HAS_SESSION: "auth_has_session";
	/** Authentication: return URL in sessionStorage. */
	AUTH_RETURN_URL: "auth_return_url";
	/** Authentication: MFA state in sessionStorage. */
	AUTH_MFA_STATE: "auth_mfa_state";
	/** Authentication: inactivity logout flag in sessionStorage. */
	AUTH_INACTIVITY_LOGOUT: "auth_inactivity_logout";
	/** Error queue: persisted errors in localStorage. */
	ERROR_QUEUE: "error-queue";
	/** Layout: sidebar collapsed state in sessionStorage. */
	SIDEBAR_SESSION: "seventysix-sidebar-session";
	/** Theme: brightness preference in localStorage. */
	THEME_BRIGHTNESS: "seventysix-theme-brightness";
	/** Theme: color scheme preference in localStorage. */
	THEME_COLOR_SCHEME: "seventysix-color-scheme";
}> =
	{
		AUTH_HAS_SESSION: "auth_has_session",
		AUTH_RETURN_URL: "auth_return_url",
		AUTH_MFA_STATE: "auth_mfa_state",
		AUTH_INACTIVITY_LOGOUT: "auth_inactivity_logout",
		ERROR_QUEUE: "error-queue",
		SIDEBAR_SESSION: "seventysix-sidebar-session",
		THEME_BRIGHTNESS: "seventysix-theme-brightness",
		THEME_COLOR_SCHEME: "seventysix-color-scheme"
	} as const;