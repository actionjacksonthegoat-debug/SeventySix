import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
	{
		path: "login",
		loadComponent: () =>
			import("./login/login.component").then((m) => m.LoginComponent),
		data: { breadcrumb: "Login" }
	},
	{
		path: "register",
		loadComponent: () =>
			import("./register/register-email.component").then(
				(m) => m.RegisterEmailComponent
			),
		data: { breadcrumb: "Create Account" }
	},
	{
		path: "register/complete",
		loadComponent: () =>
			import("./register/register-complete.component").then(
				(m) => m.RegisterCompleteComponent
			),
		data: { breadcrumb: "Complete Registration" }
	},
	{
		path: "forgot-password",
		loadComponent: () =>
			import("./forgot-password/forgot-password.component").then(
				(m) => m.ForgotPasswordComponent
			),
		data: { breadcrumb: "Forgot Password" }
	},
	{
		path: "change-password",
		loadComponent: () =>
			import("./change-password/change-password.component").then(
				(m) => m.ChangePasswordComponent
			),
		data: { breadcrumb: "Change Password" }
	},
	{
		path: "set-password",
		loadComponent: () =>
			import("./set-password/set-password.component").then(
				(m) => m.SetPasswordComponent
			),
		data: { breadcrumb: "Set Password" }
	}
];
