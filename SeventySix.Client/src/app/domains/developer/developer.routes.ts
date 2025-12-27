/**
 * Developer Feature Routes
 * Lazy-loaded routes for developer tools
 * Requires Developer role
 */
import { Routes } from "@angular/router";

/**
 * Developer feature routes (style guide, architecture docs).
 * Intended for developer role usage and lazy-loaded under `/developer`.
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
		},
		{
			path: "architecture-guide",
			loadComponent: () =>
				import("./pages/architecture-guide/architecture-guide").then(
					(module) =>
						module.ArchitectureGuideComponent),
			title: "Architecture Guide - SeventySix",
			data: { breadcrumb: "Architecture Guide" }
		}
	];
