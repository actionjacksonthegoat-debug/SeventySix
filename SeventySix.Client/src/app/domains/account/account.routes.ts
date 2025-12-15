import { AccountService } from "@account/services";
import { Routes } from "@angular/router";

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
