/**
 * Developer Feature Routes
 * Lazy-loaded routes for developer tools
 * Requires Developer role
 */
import { Routes } from "@angular/router";

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
			title: "Style Guide - SeventySix"
		},
		{
			path: "architecture-guide",
			loadComponent: () =>
				import("./pages/architecture-guide/architecture-guide").then(
					(module) =>
						module.ArchitectureGuideComponent),
			title: "Architecture Guide - SeventySix"
		}
	];
