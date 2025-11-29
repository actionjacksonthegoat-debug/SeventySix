import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
	{
		path: "login",
		loadComponent: () =>
			import("./login/login.component").then((m) => m.LoginComponent),
		data: { breadcrumb: "Login" }
	},
	{
		path: "change-password",
		loadComponent: () =>
			import("./change-password/change-password.component").then(
				(m) => m.ChangePasswordComponent
			),
		data: { breadcrumb: "Change Password" }
	}
];
