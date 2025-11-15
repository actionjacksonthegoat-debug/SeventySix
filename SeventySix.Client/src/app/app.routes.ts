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
		path: "weather-forecast",
		loadComponent: () =>
			import("./features/home/weather/weather-forecast.component").then(
				(m) => m.WeatherForecastComponent
			),
		title: "Weather Forecast",
		data: { breadcrumb: "Weather Forecast" }
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
