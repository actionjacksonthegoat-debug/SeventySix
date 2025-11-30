/**
 * User Feature Routes
 * Routes for authenticated users to access their own profile
 * Reuses components from admin/users but with different route path
 */
import { Routes } from "@angular/router";
import {
	UserService,
	UserPreferencesService
} from "@admin/users/services";
import { UserRepository } from "@admin/users/repositories";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";

export const USER_ROUTES: Routes = [
	{
		path: ":id",
		providers: [
			UserService,
			UserRepository,
			UserPreferencesService,
			PermissionRequestService,
			PermissionRequestRepository
		],
		loadComponent: () =>
			import("@admin/users/subpages/user/user-page").then(
				(m) => m.UserPage
			),
		title: "My Profile - SeventySix",
		data: { breadcrumb: "Profile" }
	},
	{
		path: ":id/request-permissions",
		providers: [
			UserService,
			UserRepository,
			PermissionRequestService,
			PermissionRequestRepository
		],
		loadComponent: () =>
			import(
				"@admin/users/subpages/request-permissions/request-permissions.component"
			).then((m) => m.RequestPermissionsComponent),
		title: "Request Permissions - SeventySix",
		data: { breadcrumb: "Request Permissions" }
	}
];
