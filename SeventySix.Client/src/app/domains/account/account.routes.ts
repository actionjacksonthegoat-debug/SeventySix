import { AccountService } from "@account/services";
import { Routes } from "@angular/router";

/**
 * Routes for the Account domain.
 *
 * Provides routes for viewing and editing the current user's profile and
 * requesting additional permissions.
 */
export const ACCOUNT_ROUTES: Routes =
	[
		{
			path: "",
			providers: [AccountService],
			loadComponent: () =>
				import("./pages/profile/profile").then(
					(m) => m.ProfilePage),
			title: "My Profile - SeventySix"
		},
		{
			path: "permissions",
			providers: [AccountService],
			loadComponent: () =>
				import("./pages/request-permissions/request-permissions").then(
					(m) => m.RequestPermissionsPage),
			title: "Request Permissions - SeventySix"
		}
	];
