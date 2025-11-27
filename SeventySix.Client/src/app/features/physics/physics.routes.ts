/**
 * Physics Feature Routes
 * Lazy-loaded routes for physics calculation features
 */
import { Routes } from "@angular/router";

export const PHYSICS_ROUTES: Routes = [
	{
		path: "",
		loadComponent: () => import("./physics/physics").then((m) => m.Physics),
		title: "Physics - Calculations"
	}
];
