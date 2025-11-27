/**
 * Home Feature Routes
 * Lazy-loaded routes for home/landing features
 */
import { Routes } from "@angular/router";

export const HOME_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () =>
			import("./home-page/home-page").then((m) => m.HomePage),
		title: "SeventySix - Home"
	}
];
