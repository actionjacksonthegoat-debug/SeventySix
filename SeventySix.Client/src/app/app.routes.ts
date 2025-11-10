import { Routes } from "@angular/router";

/**
 * Application routes with lazy loading.
 * All feature modules are lazy-loaded for optimal performance.
 */
export const routes: Routes = [
	{
		path: "",
		redirectTo: "users",
		pathMatch: "full"
	},
	{
		path: "users",
		children: [
			{
				path: "",
				loadComponent: () =>
					import("./features/users/users/users-page").then(
						(m) => m.UsersPage
					),
				title: "User Management"
			},
			{
				path: ":id",
				loadComponent: () =>
					import("./features/users/user/user-page").then(
						(m) => m.UserPage
					),
				title: "Edit User"
			}
		]
	},
	{
		path: "game",
		loadComponent: () =>
			import("./features/game/world-map/world-map").then(
				(m) => m.WorldMap
			),
		title: "Game - World Map"
	},
	{
		path: "sandbox",
		children: [
			// Add sandbox routes here when implemented
		]
	},
	{
		path: "**",
		redirectTo: "users"
	}
];
