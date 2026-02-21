import { AccountService } from "@account/services";
import { Routes } from "@angular/router";

/**
 * Routes for the Account domain.
 *
 * Provides routes for viewing and editing the current user's profile and
 * requesting additional permissions.
 * Uses children pattern to ensure single AccountService instance per feature navigation.
 */
export const ACCOUNT_ROUTES: Routes =
	[
		{
			path: "",
			providers: [AccountService],
			children: [
				{
					path: "",
					loadComponent: () =>
						import("./pages/profile/profile").then(
							(module) => module.ProfilePage),
					title: "My Profile - SeventySix",
					data: { breadcrumb: "Profile" }
				},
				{
					path: "permissions",
					loadComponent: () =>
						import("./pages/request-permissions/request-permissions").then(
							(module) =>
								module.RequestPermissionsPage),
					title: "Request Permissions - SeventySix",
					data: { breadcrumb: "Request Permissions" }
				}
			]
		}
	];