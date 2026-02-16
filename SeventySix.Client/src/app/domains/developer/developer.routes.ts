/**
 * Developer Feature Routes.
 * Lazy-loaded routes for developer tools.
 * Requires Developer role.
 */
import { Routes } from "@angular/router";

/**
 * Developer feature routes (style guide and developer tools).
 * Lazy-loaded under `/developer` with role guard.
 */
export const DEVELOPER_ROUTES: Routes =
	[
		{
			path: "",
			redirectTo: "style-guide",
			pathMatch: "full"
		},
		{
			path: "style-guide",
			loadComponent: () =>
				import("./pages/style-guide/style-guide").then(
					(module) => module.StyleGuideComponent),
			title: "Style Guide - SeventySix",
			data: { breadcrumb: "Style Guide" }
		}
	];
