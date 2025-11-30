import { Routes } from "@angular/router";
import { roleGuard } from "@infrastructure/guards/role.guard";

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
export const routes: Routes = [
	// ══════════════════════════════════════════════════════════════
	// PUBLIC ROUTES (Guest Access - No Authentication Required)
	// ══════════════════════════════════════════════════════════════
	{
		path: "",
		loadChildren: () =>
			import("./features/home/home.routes").then((m) => m.HOME_ROUTES)
	},
	{
		path: "game",
		loadChildren: () =>
			import("./features/game/game.routes").then((m) => m.GAME_ROUTES),
		data: { breadcrumb: "Game" }
	},
	{
		path: "physics",
		loadChildren: () =>
			import("./features/physics/physics.routes").then(
				(m) => m.PHYSICS_ROUTES
			),
		data: { breadcrumb: "Physics" }
	},
	{
		path: "rv-camper",
		loadChildren: () =>
			import("./features/rv-camper/rv-camper.routes").then(
				(m) => m.RV_CAMPER_ROUTES
			),
		data: { breadcrumb: "RV Camper" }
	},
	// Auth routes (login, change-password - public)
	{
		path: "auth",
		loadChildren: () =>
			import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
		data: { breadcrumb: "Authentication" }
	},

	// ══════════════════════════════════════════════════════════════
	// USER ROUTES (Any Authenticated User - Own Profile Only)
	// ══════════════════════════════════════════════════════════════
	{
		path: "user",
		loadChildren: () =>
			import("./features/user/user.routes").then((m) => m.USER_ROUTES),
		canActivate: [roleGuard()],
		data: { breadcrumb: "User" }
	},

	// ══════════════════════════════════════════════════════════════
	// DEVELOPER ROUTES (Developer or Admin - ADDITIVE)
	// ══════════════════════════════════════════════════════════════
	{
		path: "developer",
		loadChildren: () =>
			import("./features/developer/developer.routes").then(
				(m) => m.DEVELOPER_ROUTES
			),
		canActivate: [roleGuard("Developer", "Admin")],
		data: { breadcrumb: "Developer" }
	},

	// ══════════════════════════════════════════════════════════════
	// ADMIN ROUTES (Admin Only)
	// ══════════════════════════════════════════════════════════════
	{
		path: "admin",
		loadChildren: () =>
			import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES),
		canActivate: [roleGuard("Admin")],
		data: { breadcrumb: "Admin" }
	},

	// Error pages
	{
		path: "error",
		loadChildren: () =>
			import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES)
	},

	// Fallback
	{
		path: "**",
		loadComponent: () =>
			import("./features/admin/error-pages/not-found/not-found").then(
				(m) => m.NotFoundPage
			),
		title: "Page Not Found"
	}
];
