import { Routes } from "@angular/router";

/**
 * Application routes with lazy loading.
 * All feature modules are lazy-loaded as bounded contexts.
 * Each feature has its own routes file for easy enable/disable.
 */
export const routes: Routes = [
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
	{
		path: "developer",
		loadChildren: () =>
			import("./features/developer/developer.routes").then(
				(m) => m.DEVELOPER_ROUTES
			),
		data: { breadcrumb: "Developer" }
	},
	{
		path: "admin",
		loadChildren: () =>
			import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES),
		data: { breadcrumb: "Admin" }
	},
	{
		path: "error",
		loadChildren: () =>
			import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES)
	},
	{
		path: "**",
		loadComponent: () =>
			import("./features/admin/error-pages/not-found/not-found").then(
				(m) => m.NotFoundPage
			),
		title: "Page Not Found"
	}
];
