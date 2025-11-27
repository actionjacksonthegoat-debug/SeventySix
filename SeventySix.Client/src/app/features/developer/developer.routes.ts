/**
 * Developer Feature Routes
 * Lazy-loaded routes for developer tools and utilities
 */
import { Routes } from "@angular/router";

export const DEVELOPER_ROUTES: Routes = [
	{
		path: "",
		redirectTo: "style-guide",
		pathMatch: "full"
	},
	{
		path: "style-guide",
		loadComponent: () =>
			import("./style-guide/style-guide.component").then(
				(m) => m.StyleGuideComponent
			),
		title: "Style Guide"
	}
];
