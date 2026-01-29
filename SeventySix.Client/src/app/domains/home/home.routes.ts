/**
 * Home Feature Routes
 * Lazy-loaded routes for home/landing features
 */
import { Routes } from "@angular/router";

/**
 * Home feature routes (landing page and public home routes).
 * Lazy-loaded as the application root.
 */
export const HOME_ROUTES: Routes =
	[
		{
			path: "",
			loadComponent: () =>
				import("./pages/home/home.component").then(
					(module) => module.HomeComponent),
			title: "SeventySix - Home",
			data: { breadcrumb: "Home" }
		}
	];
