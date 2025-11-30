import { Routes } from "@angular/router";
import { AccountService } from "./services";
import { AccountRepository } from "./repositories";

export const ACCOUNT_ROUTES: Routes =
[
	{
		path: "",
		providers: [AccountService, AccountRepository],
		loadComponent: () =>
			import("./profile/profile-page").then((m) => m.ProfilePage),
		title: "My Profile - SeventySix"
	},
	{
		path: "permissions",
		providers: [AccountService, AccountRepository],
		loadComponent: () =>
			import("./permissions/request-permissions").then(
				(m) => m.RequestPermissionsPage
			),
		title: "Request Permissions - SeventySix"
	}
];
