import { Routes } from "@angular/router";
import {
	ROLE_ADMIN,
	ROLE_DEVELOPER
} from "@shared/constants/role.constants";
import { roleGuard } from "@shared/guards/role.guard";

/**
 * Application route configuration.
 * Defines public, authenticated, admin, and developer routes and their lazy-loading behavior.
 * Use `roleGuard()` with `canMatch` to secure routes - this prevents lazy module download
 * until authorization is verified, saving bandwidth for unauthorized users.
 */
export const routes: Routes =
	[
	// ══════════════════════════════════════════════════════════════
	// PUBLIC ROUTES (Guest Access - No Authentication Required)
	// ══════════════════════════════════════════════════════════════
		{
			path: "",
			loadChildren: () =>
				import("./domains/home/home.routes").then(
					(module) => module.HOME_ROUTES),
			data: { preload: true }
		},
		{
			path: "sandbox",
			loadChildren: () =>
				import("./domains/sandbox/sandbox.routes").then(
					(module) => module.SANDBOX_ROUTES),
			data: {
				preload: true,
				breadcrumb: "Sandbox"
			}
		},
		// Auth routes (login, change-password - public) - preloaded for fast access
		{
			path: "auth",
			loadChildren: () =>
				import("./domains/auth/auth.routes").then(
					(module) => module.AUTH_ROUTES),
			data: {
				preload: true,
				breadcrumb: "Authentication"
			}
		},

		// ══════════════════════════════════════════════════════════════
		// USER ROUTES (Any Authenticated User - Own Account Only)
		// canMatch prevents module download until auth verified
		// ══════════════════════════════════════════════════════════════
		{
			path: "account",
			loadChildren: () =>
				import("./domains/account/account.routes").then(
					(module) => module.ACCOUNT_ROUTES),
			canMatch: [roleGuard()],
			data: { breadcrumb: "Account" }
		},

		// ══════════════════════════════════════════════════════════════
		// ADMIN ROUTES (Admin Only)
		// canMatch prevents module download until role verified
		// ══════════════════════════════════════════════════════════════
		{
			path: "admin",
			loadChildren: () =>
				import("./domains/admin/admin.routes").then(
					(module) => module.ADMIN_ROUTES),
			canMatch: [roleGuard(ROLE_ADMIN)],
			data: { breadcrumb: "Admin" }
		},

		// ══════════════════════════════════════════════════════════════
		// DEVELOPER ROUTES (Developer OR Admin)
		// canMatch prevents module download until role verified
		// ══════════════════════════════════════════════════════════════
		{
			path: "developer",
			loadChildren: () =>
				import("./domains/developer/developer.routes").then(
					(module) => module.DEVELOPER_ROUTES),
			canMatch: [roleGuard(ROLE_DEVELOPER, ROLE_ADMIN)],
			data: { breadcrumb: "Developer" }
		},

		// Fallback
		{
			path: "**",
			loadComponent: () =>
				import("@shared/pages/not-found/not-found").then(
					(module) => module.NotFoundPage),
			title: "Page Not Found"
		}
	];
