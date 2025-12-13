import { Routes } from "@angular/router";
import { AccountService } from "./services";

export const ACCOUNT_ROUTES: Routes = [
	{
		path: "",
		providers: [AccountService],
		loadComponent: () =>
			import("./profile/profile").then((m) => m.ProfilePage),
		title: "My Profile - SeventySix"
	},
	{
		path: "permissions",
		providers: [AccountService],
		loadComponent: () =>
			import("./request-permissions/request-permissions").then(
				(m) => m.RequestPermissionsPage
			),
		title: "Request Permissions - SeventySix"
	}
];
