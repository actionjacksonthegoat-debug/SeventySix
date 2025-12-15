/**
 * Sandbox Feature Routes
 * Lazy-loaded routes for sandbox experimentation area
 */
import { Routes } from "@angular/router";

export const SANDBOX_ROUTES: Routes =
	[
		{
			path: "",
			loadComponent: () =>
				import("./pages/sandbox-landing/sandbox-landing").then(
					(module) =>
						module.SandboxLandingComponent),
			title: "Sandbox - SeventySix"
		}
	];
