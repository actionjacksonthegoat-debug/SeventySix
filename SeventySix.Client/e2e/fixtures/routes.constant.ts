// <copyright file="routes.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Application routes for E2E navigation.
 * Mirrors Angular route configuration.
 */
export const ROUTES =
	{
		home: "/",

		auth:
			{
				login: "/auth/login",
				register: "/auth/register",
				forgotPassword: "/auth/forgot-password",
				changePassword: "/auth/change-password",
				setPassword: "/auth/set-password",
				mfaVerify: "/auth/mfa/verify",
				totpSetup: "/auth/totp-setup",
				backupCodes: "/auth/backup-codes"
			},

		account:
			{
				root: "/account",
				permissions: "/account/permissions"
			},

		admin:
			{
				dashboard: "/admin/dashboard",
				users: "/admin/users",
				userCreate: "/admin/users/create",
				logs: "/admin/logs",
				permissionRequests: "/admin/permission-requests"
			},

		developer:
			{
				styleGuide: "/developer/style-guide",
				architectureGuide: "/developer/architecture-guide"
			},

		sandbox:
			{
				root: "/sandbox"
			}
	} as const;

/**
 * Route groups for parameterized RBAC tests.
 */
export const ROUTE_GROUPS =
	{
		/**
		 * Public pages for accessibility testing.
		 */
		publicPages:
			[
				{ path: ROUTES.home, name: "Home" },
				{ path: ROUTES.auth.login, name: "Login" },
				{ path: ROUTES.auth.register, name: "Register" },
				{ path: ROUTES.auth.forgotPassword, name: "Forgot Password" }
			] as const,

		adminRoutes:
			[
				ROUTES.admin.dashboard,
				ROUTES.admin.users,
				ROUTES.admin.logs,
				ROUTES.admin.permissionRequests
			] as const,

		developerRoutes:
			[
				ROUTES.developer.styleGuide,
				ROUTES.developer.architectureGuide
			] as const,

		accountRoutes:
			[
				ROUTES.account.root,
				ROUTES.account.permissions
			] as const,

		/**
		 * Account pages for authenticated accessibility testing.
		 */
		accountAccessibilityPages:
			[
				{ path: ROUTES.account.root, name: "Profile" },
				{ path: ROUTES.account.permissions, name: "Request Permissions" }
			] as const,

		/**
		 * Admin pages for authenticated accessibility testing.
		 */
		adminAccessibilityPages:
			[
				{ path: ROUTES.admin.dashboard, name: "Admin Dashboard" },
				{ path: ROUTES.admin.users, name: "User Management" },
				{ path: ROUTES.admin.logs, name: "Log Management" },
				{ path: ROUTES.admin.permissionRequests, name: "Permission Requests" }
			] as const,

		/**
		 * Developer pages for authenticated accessibility testing.
		 */
		developerAccessibilityPages:
			[
				{ path: ROUTES.developer.styleGuide, name: "Style Guide" },
				{ path: ROUTES.developer.architectureGuide, name: "Architecture Guide" }
			] as const
	} as const;

/**
 * Creates a regex pattern for route matching.
 * Escapes forward slashes for use in toHaveURL assertions.
 * @param route
 * The route path to convert.
 * @returns
 * Regex pattern matching the route.
 */
export function createRouteRegex(route: string): RegExp
{
	const escapedRoute: string =
		route.replace(/\//g, "\\/");

	return new RegExp(escapedRoute);
}
