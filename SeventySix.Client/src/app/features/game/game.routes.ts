/**
 * Game Feature Routes
 * Lazy-loaded routes for game-related features
 */
import { Routes } from "@angular/router";

export const GAME_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () =>
			import("./world-map/world-map").then((m) => m.WorldMap),
		title: "Game - World Map"
	}
];
