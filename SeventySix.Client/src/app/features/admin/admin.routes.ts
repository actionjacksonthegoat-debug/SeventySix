/**
 * Admin Feature Routes
 * Lazy-loaded routes for admin-only features
 * Services are provided at route level for proper garbage collection
 */
import { Routes } from "@angular/router";
import { LogManagementService } from "@admin/logs/services";
import { LogRepository } from "@admin/logs/repositories";
import {
	UserService,
	UserExportService,
	UserPreferencesService
} from "@admin/users/services";
import { UserRepository } from "@admin/users/repositories";

export const ADMIN_ROUTES: Routes = [
	{
		path: "",
		redirectTo: "dashboard",
		pathMatch: "full"
	},
	{
		path: "logs",
		providers: [LogManagementService, LogRepository],
		loadComponent: () =>
			import("./logs/log-management.component").then(
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
		providers: [
			UserService,
			UserRepository,
			UserExportService,
			UserPreferencesService
		],
		children: [
			{
				path: "",
				loadComponent: () =>
					import("./users/users.component").then(
						(m) => m.UsersComponent
					),
				title: "User Management - SeventySix"
			},
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
