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
	/** Error queue: persisted errors in localStorage. */
	ERROR_QUEUE: "error-queue";
	/** Layout: sidebar collapsed state in sessionStorage. */
	SIDEBAR_SESSION: "seventysix-sidebar-session";
	/** Theme: color scheme preference in localStorage. */
	THEME_COLOR_SCHEME: "theme-color-scheme";
}> =
	{
		AUTH_HAS_SESSION: "auth_has_session",
		AUTH_RETURN_URL: "auth_return_url",
		ERROR_QUEUE: "error-queue",
		SIDEBAR_SESSION: "seventysix-sidebar-session",
		THEME_COLOR_SCHEME: "theme-color-scheme"
	} as const;
