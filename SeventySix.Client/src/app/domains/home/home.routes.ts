/**
 * Home Feature Routes
 * Eagerly-loaded routes for home/landing features (landing page is on the critical render path).
 */
import { Routes } from "@angular/router";
import { HomeComponent } from "@home/pages/home/home.component";

/**
 * Home feature routes (landing page and public home routes).
 * Lazy-loaded as the application root.
 */
export const HOME_ROUTES: Routes =
	[
		{
			path: "",
			// Eager — part of initial bundle so landing page renders in the first Angular cycle
			component: HomeComponent,
			title: "SeventySix - Home",
			data: { breadcrumb: "Home" }
		},
		{
			path: "privacy-policy",
			loadComponent: () =>
				import("./pages/privacy-policy/privacy-policy.page").then(
					(module) => module.PrivacyPolicyPage),
			title: "Privacy Policy"
		},
		{
			path: "terms-of-service",
			loadComponent: () =>
				import("./pages/terms-of-service/terms-of-service.page").then(
					(module) => module.TermsOfServicePage),
			title: "Terms of Service"
		}
	];