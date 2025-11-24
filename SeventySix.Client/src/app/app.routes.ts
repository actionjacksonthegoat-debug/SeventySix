import { Routes } from "@angular/router";

/**
 * Application routes with lazy loading.
 * All feature modules are lazy-loaded for optimal performance.
 */
export const routes: Routes = [
	{
		path: "",
		loadComponent: () =>
			import("./features/home/home-page/home-page").then(
				(m) => m.HomePage
			),
		title: "SeventySix - Home"
	},
	{
		path: "game",
		loadComponent: () =>
			import("./features/game/world-map/world-map").then(
				(m) => m.WorldMap
			),
		title: "Game - World Map",
		data: { breadcrumb: "Game" }
	},
	{
		path: "physics",
		loadComponent: () =>
			import("./features/physics/physics/physics").then((m) => m.Physics),
		title: "Physics - Calculations",
		data: { breadcrumb: "Physics" }
	},
	{
		path: "rv-camper",
		loadComponent: () =>
			import("./features/rv-camper/rv-camper/rv-camper").then(
				(m) => m.RVCamper
			),
		title: "RV Camper - Projects",
		data: { breadcrumb: "RV Camper" }
	},
	{
		path: "developer/style-guide",
		loadComponent: () =>
			import(
				"./features/developer/style-guide/style-guide.component"
			).then((m) => m.StyleGuideComponent),
		title: "Style Guide",
		data: { breadcrumb: "Style Guide" }
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
