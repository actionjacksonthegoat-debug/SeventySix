import { Routes } from "@angular/router";

/**
 * Application routes with lazy loading.
 * All feature modules are lazy-loaded for optimal performance.
 */
export const routes: Routes = [
	{
		path: "",
		redirectTo: "game",
		pathMatch: "full"
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
		redirectTo: "game"
	}
];
