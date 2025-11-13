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
		path: "users",
		data: { breadcrumb: "Users" },
		children: [
			{
				path: "",
				loadComponent: () =>
					import("./features/admin/users/users/users-page").then(
						(m) => m.UsersPage
					),
				title: "User Management",
				data: { breadcrumb: "List" }
			},
			{
				path: "new",
				loadComponent: () =>
					import(
						"./features/admin/users/user-create/user-create"
					).then((m) => m.UserCreatePage),
				title: "Create User",
				data: { breadcrumb: "New" }
			},
			{
				path: ":id",
				loadComponent: () =>
					import("./features/admin/users/user/user-page").then(
						(m) => m.UserPage
					),
				title: "Edit User",
				data: { breadcrumb: "Edit" }
			}
		]
	},
	{
		path: "weather-forecast",
		loadComponent: () =>
			import(
				"./features/home/weather/weather-forecast/weather-forecast"
			).then((m) => m.WeatherForecastPage),
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
		path: "style-guide",
		loadComponent: () =>
			import(
				"./features/developer/style-guide/style-guide.component"
			).then((m) => m.StyleGuideComponent),
		title: "Style Guide",
		data: { breadcrumb: "Style Guide" }
	},
	{
		path: "admin",
		data: { breadcrumb: "Admin" },
		children: [
			{
				path: "",
				loadComponent: () =>
					import(
						"./features/admin/admin-dashboard/admin-dashboard.component"
					).then((m) => m.AdminDashboardComponent),
				title: "Admin Dashboard"
			},
			{
				path: "logs",
				loadComponent: () =>
					import(
						"./features/admin/pages/log-management-page/log-management-page.component"
					).then((m) => m.LogManagementPageComponent),
				title: "Log Management",
				data: { breadcrumb: "Logs" }
			}
		]
	},
	{
		path: "error",
		children: [
			{
				path: "404",
				loadComponent: () =>
					import(
						"./features/admin/error-pages/not-found/not-found"
					).then((m) => m.NotFoundPage),
				title: "Page Not Found"
			},
			{
				path: "500",
				loadComponent: () =>
					import(
						"./features/admin/error-pages/server-error/server-error"
					).then((m) => m.ServerErrorPage),
				title: "Server Error"
			}
		]
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
