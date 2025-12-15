import { Routes } from "@angular/router";
import {
	ROLE_ADMIN,
	ROLE_DEVELOPER
} from "@shared/constants/role.constants";
import { roleGuard } from "@shared/guards/role.guard";

/**
 * Application routes with lazy loading.
 * All feature modules are lazy-loaded as bounded contexts.
 * Each feature has its own routes file for easy enable/disable.
 *
 * Access Levels:
 * - Public: No guard (guest access)
 * - Authenticated: roleGuard() - any logged-in user
 * - Role-based: roleGuard("Admin") or roleGuard("Developer", "Admin")
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
					(module) => module.HOME_ROUTES)
		},
		{
			path: "sandbox",
			loadChildren: () =>
				import("./domains/sandbox/sandbox.routes").then(
					(module) => module.SANDBOX_ROUTES),
			data: { breadcrumb: "Sandbox" }
		},
		// Auth routes (login, change-password - public)
		{
			path: "auth",
			loadChildren: () =>
				import("./domains/auth/auth.routes").then(
					(module) => module.AUTH_ROUTES),
			data: { breadcrumb: "Authentication" }
		},

		// ══════════════════════════════════════════════════════════════
		// USER ROUTES (Any Authenticated User - Own Account Only)
		// ══════════════════════════════════════════════════════════════
		{
			path: "account",
			loadChildren: () =>
				import("./domains/account/account.routes").then(
					(module) => module.ACCOUNT_ROUTES),
			canActivate: [roleGuard()],
			data: { breadcrumb: "Account" }
		},

		// ══════════════════════════════════════════════════════════════
		// ADMIN ROUTES (Admin Only)
		// ══════════════════════════════════════════════════════════════
		{
			path: "admin",
			loadChildren: () =>
				import("./domains/admin/admin.routes").then(
					(module) => module.ADMIN_ROUTES),
			canActivate: [roleGuard(ROLE_ADMIN)],
			data: { breadcrumb: "Admin" }
		},

		// ══════════════════════════════════════════════════════════════
		// DEVELOPER ROUTES (Developer Role Required)
		// ══════════════════════════════════════════════════════════════
		{
			path: "developer",
			loadChildren: () =>
				import("./domains/developer/developer.routes").then(
					(module) => module.DEVELOPER_ROUTES),
			canActivate: [roleGuard(ROLE_DEVELOPER)],
			data: { breadcrumb: "Developer" }
		},

		// Error pages route removed - handled by wildcard fallback

		// Fallback
		{
			path: "**",
			loadComponent: () =>
				import("@shared/pages/not-found/not-found").then(
					(module) => module.NotFoundPage),
			title: "Page Not Found"
		}
	];
