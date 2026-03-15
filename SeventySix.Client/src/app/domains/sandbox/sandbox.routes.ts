/**
 * Sandbox Feature Routes
 * Lazy-loaded routes for sandbox experimentation area.
 */
import { Routes } from "@angular/router";

/**
 * Sandbox feature routes for the Hello World experimentation page.
 * Lazy-loaded under `/sandbox` for isolation from production flows.
 */
export const SANDBOX_ROUTES: Routes =
	[
		{
			path: "",
			loadComponent: () =>
				import("./pages/sandbox-landing/sandbox-landing").then(
					(module) =>
						module.SandboxLandingComponent),
			title: "Sandbox - SeventySix",
			data: { breadcrumb: "Sandbox" }
		}
	];