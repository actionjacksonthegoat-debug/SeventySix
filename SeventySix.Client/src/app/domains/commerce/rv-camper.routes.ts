/**
 * RV Camper Feature Routes
 * Lazy-loaded routes for RV camper project features
 */
import { Routes } from "@angular/router";

export const RV_CAMPER_ROUTES: Routes =
	[
		{
			path: "",
			loadComponent: () =>
				import("./rv-camper/rv-camper").then(
					(m) => m.RVCamper),
			title: "RV Camper - Projects"
		}
	];
