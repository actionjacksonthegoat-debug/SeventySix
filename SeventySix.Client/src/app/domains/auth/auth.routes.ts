import { Routes } from "@angular/router";

export const AUTH_ROUTES: Routes =
	[
		{
			path: "login",
			loadComponent: () =>
				import("./pages/login/login").then(
					(m) => m.LoginComponent),
			data: { breadcrumb: "Login" }
		},
		{
			path: "register",
			loadComponent: () =>
				import("./pages/register-email/register-email").then(
					(m) => m.RegisterEmailComponent),
			data: { breadcrumb: "Create Account" }
		},
		{
			path: "register/complete",
			loadComponent: () =>
				import("./pages/register-complete/register-complete").then(
					(m) => m.RegisterCompleteComponent),
			data: { breadcrumb: "Complete Registration" }
		},
		{
			path: "forgot-password",
			loadComponent: () =>
				import("./pages/forgot-password/forgot-password").then(
					(m) => m.ForgotPasswordComponent),
			data: { breadcrumb: "Forgot Password" }
		},
		{
			path: "change-password",
			loadComponent: () =>
				import("./pages/change-password/change-password").then(
					(m) => m.ChangePasswordComponent),
			data: { breadcrumb: "Change Password" }
		},
		{
			path: "set-password",
			loadComponent: () =>
				import("./pages/set-password/set-password").then(
					(m) => m.SetPasswordComponent),
			data: { breadcrumb: "Set Password" }
		}
	];
