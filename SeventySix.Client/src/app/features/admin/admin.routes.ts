/**
 * Admin Feature Routes
 * Lazy-loaded routes for admin-only features
 */
import { Routes } from "@angular/router";

export const ADMIN_ROUTES: Routes = [
	{
		path: "",
		redirectTo: "dashboard",
		pathMatch: "full"
	},
	{
		path: "logs",
		loadComponent: () =>
			import("./log-management/log-management.component").then(
				(m) => m.LogManagementComponent
			),
		title: "Log Management - SeventySix"
	},
	{
		path: "dashboard",
		loadComponent: () =>
			import("./admin-dashboard/admin-dashboard.component").then(
				(m) => m.AdminDashboardComponent
			),
		title: "Admin Dashboard - SeventySix"
	},
	{
		path: "users",
		loadComponent: () =>
			import("./users/users.component").then((m) => m.UsersComponent),
		title: "User Management - SeventySix",
		children: [
			{
				path: "create",
				loadComponent: () =>
					import("./users/subpages/user-create/user-create").then(
						(m) => m.UserCreatePage
					),
				title: "Create User - SeventySix"
			},
			{
				path: ":id",
				loadComponent: () =>
					import("./users/subpages/user/user-page").then(
						(m) => m.UserPage
					),
				title: "User Details - SeventySix"
			}
		]
	},
	{
		path: "not-found",
		loadComponent: () =>
			import("./error-pages/not-found/not-found").then(
				(m) => m.NotFoundPage
			),
		title: "Page Not Found - SeventySix"
	},
	{
		path: "server-error",
		loadComponent: () =>
			import("./error-pages/server-error/server-error").then(
				(m) => m.ServerErrorPage
			),
		title: "Server Error - SeventySix"
	}
];
