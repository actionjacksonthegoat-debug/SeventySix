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
					(m) => m.HOME_ROUTES)
		},
		{
			path: "game",
			loadChildren: () =>
				import("./domains/game/game.routes").then(
					(m) => m.GAME_ROUTES),
			data: { breadcrumb: "Game" }
		},
		{
			path: "physics",
			loadChildren: () =>
				import("./domains/physics/physics.routes").then(
					(m) => m.PHYSICS_ROUTES),
			data: { breadcrumb: "Physics" }
		},
		{
			path: "rv-camper",
			loadChildren: () =>
				import("./domains/commerce/rv-camper.routes").then(
					(m) => m.RV_CAMPER_ROUTES),
			data: { breadcrumb: "RV Camper" }
		},
		// Auth routes (login, change-password - public)
		{
			path: "auth",
			loadChildren: () =>
				import("./domains/auth/auth.routes").then(
					(m) => m.AUTH_ROUTES),
			data: { breadcrumb: "Authentication" }
		},

		// ══════════════════════════════════════════════════════════════
		// USER ROUTES (Any Authenticated User - Own Account Only)
		// ══════════════════════════════════════════════════════════════
		{
			path: "account",
			loadChildren: () =>
				import("./domains/account/account.routes").then(
					(m) => m.ACCOUNT_ROUTES),
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
					(m) => m.ADMIN_ROUTES),
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
					(m) => m.DEVELOPER_ROUTES),
			canActivate: [roleGuard(ROLE_DEVELOPER)],
			data: { breadcrumb: "Developer" }
		},

		// Error pages route removed - handled by wildcard fallback

		// Fallback
		{
			path: "**",
			loadComponent: () =>
				import("@shared/pages/not-found/not-found").then(
					(m) => m.NotFoundPage),
			title: "Page Not Found"
		}
	];
