import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes = [
	{
		path: "login",
		loadComponent: () =>
			import("./login/login").then((m) => m.LoginComponent),
		data: { breadcrumb: "Login" }
	},
	{
		path: "register",
		loadComponent: () =>
			import("./register-email/register-email").then(
				(m) => m.RegisterEmailComponent
			),
		data: { breadcrumb: "Create Account" }
	},
	{
		path: "register/complete",
		loadComponent: () =>
			import("./register-complete/register-complete").then(
				(m) => m.RegisterCompleteComponent
			),
		data: { breadcrumb: "Complete Registration" }
	},
	{
		path: "forgot-password",
		loadComponent: () =>
			import("./forgot-password/forgot-password").then(
				(m) => m.ForgotPasswordComponent
			),
		data: { breadcrumb: "Forgot Password" }
	},
	{
		path: "change-password",
		loadComponent: () =>
			import("./change-password/change-password").then(
				(m) => m.ChangePasswordComponent
			),
		data: { breadcrumb: "Change Password" }
	},
	{
		path: "set-password",
		loadComponent: () =>
			import("./set-password/set-password").then(
				(m) => m.SetPasswordComponent
			),
		data: { breadcrumb: "Set Password" }
	}
];
