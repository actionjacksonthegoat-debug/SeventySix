// <copyright file="routes.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Application routes for E2E navigation.
 * Mirrors Angular route configuration.
 */
type Routes = {
	home: string;
	legal: { privacyPolicy: string; termsOfService: string; };
	auth: {
		login: string;
		register: string;
		registerComplete: string;
		forgotPassword: string;
		changePassword: string;
		setPassword: string;
		mfaVerify: string;
		totpSetup: string;
		backupCodes: string;
	};
	account: { root: string; permissions: string; };
	admin: {
		dashboard: string;
		users: string;
		userCreate: string;
		logs: string;
		permissionRequests: string;
	};
	developer: { styleGuide: string; };
	sandbox: { root: string; };
};

export const ROUTES: Routes =
	{
		home: "/",

		legal: {
			privacyPolicy: "/privacy-policy",
			termsOfService: "/terms-of-service"
		},

		auth: {
			login: "/auth/login",
			register: "/auth/register",
			registerComplete: "/auth/register/complete",
			forgotPassword: "/auth/forgot-password",
			changePassword: "/auth/change-password",
			setPassword: "/auth/set-password",
			mfaVerify: "/auth/mfa/verify",
			totpSetup: "/auth/totp-setup",
			backupCodes: "/auth/backup-codes"
		},

		account: {
			root: "/account",
			permissions: "/account/permissions"
		},

		admin: {
			dashboard: "/admin/dashboard",
			users: "/admin/users",
			userCreate: "/admin/users/create",
			logs: "/admin/logs",
			permissionRequests: "/admin/permission-requests"
		},

		developer: {
			styleGuide: "/developer/style-guide"
		},

		sandbox: {
			root: "/sandbox"
		}
	} as const;

/**
 * Route groups for parameterized RBAC tests.
 */
type RouteGroups = {
	publicPages: ReadonlyArray<{ path: string; name: string; }>;
	adminRoutes: ReadonlyArray<string>;
	developerRoutes: ReadonlyArray<string>;
	accountRoutes: ReadonlyArray<string>;
	accountAccessibilityPages: ReadonlyArray<{ path: string; name: string; }>;
	adminAccessibilityPages: ReadonlyArray<{ path: string; name: string; }>;
	developerAccessibilityPages: ReadonlyArray<{ path: string; name: string; }>;
};

export const ROUTE_GROUPS: RouteGroups =
	{
	/**
	 * Public pages for accessibility testing.
	 */
		publicPages: [
			{ path: ROUTES.home, name: "Home" },
			{ path: ROUTES.auth.login, name: "Login" },
			{ path: ROUTES.auth.register, name: "Register" },
			{ path: ROUTES.auth.forgotPassword, name: "Forgot Password" }
		] as const,

		adminRoutes: [
			ROUTES.admin.dashboard,
			ROUTES.admin.users,
			ROUTES.admin.logs,
			ROUTES.admin.permissionRequests
		] as const,

		developerRoutes: [
			ROUTES.developer.styleGuide
		] as const,

		accountRoutes: [
			ROUTES.account.root,
			ROUTES.account.permissions
		] as const,

		/**
	 * Account pages for authenticated accessibility testing.
	 */
		accountAccessibilityPages: [
			{ path: ROUTES.account.root, name: "Profile" },
			{ path: ROUTES.account.permissions, name: "Request Permissions" }
		] as const,

		/**
	 * Admin pages for authenticated accessibility testing.
	 */
		adminAccessibilityPages: [
			{ path: ROUTES.admin.dashboard, name: "Admin Dashboard" },
			{ path: ROUTES.admin.users, name: "User Management" },
			{ path: ROUTES.admin.logs, name: "Log Management" },
			{ path: ROUTES.admin.permissionRequests, name: "Permission Requests" }
		] as const,

		/**
	 * Developer pages for authenticated accessibility testing.
	 */
		developerAccessibilityPages: [
			{ path: ROUTES.developer.styleGuide, name: "Style Guide" }
		] as const
	} as const;

/**
 * Escapes all regex special characters in a string.
 * @param str
 * The string to escape.
 * @returns
 * The string with all regex metacharacters escaped.
 */
function escapeRegExpSpecialChars(str: string): string
{
	// Escape backslash first to prevent double-escaping, then all other metacharacters
	return str
		.replace(/\\/g, "\\\\")
		.replace(/[.*+?^${}()|[\]]/g, "\\$&");
}

/**
 * Creates a regex pattern for route matching.
 * Escapes all regex special characters in the route path to prevent injection.
 * @param route
 * The route path to convert.
 * @returns
 * Regex pattern matching the route exactly.
 */
export function createRouteRegex(route: string): RegExp
{
	return new RegExp(escapeRegExpSpecialChars(route));
}