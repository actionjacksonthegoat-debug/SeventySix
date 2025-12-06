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
import {
	ThirdPartyApiService,
	HealthApiService
} from "@admin/admin-dashboard/services";
import {
	ThirdPartyApiRepository,
	HealthApiRepository
} from "@admin/admin-dashboard/repositories";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { PermissionRequestRepository } from "@admin/permission-requests/repositories";

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
			import("./logs/log-management/log-management").then(
				(m) => m.LogManagementPage
			),
		title: "Log Management - SeventySix"
	},
	{
		path: "dashboard",
		providers: [
			ThirdPartyApiService,
			ThirdPartyApiRepository,
			HealthApiService,
			HealthApiRepository
		],
		loadComponent: () =>
			import(
				"./admin-dashboard/admin-dashboard-page/admin-dashboard"
			).then((m) => m.AdminDashboardPage),
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
					import("./users/user-management/user-management").then(
						(m) => m.UserManagementPage
					),
				title: "User Management - SeventySix"
			},
			{
				path: "create",
				loadComponent: () =>
					import("./users/user-create/user-create").then(
						(m) => m.UserCreatePage
					),
				title: "Create User - SeventySix"
			},
			{
				path: ":id",
				loadComponent: () =>
					import("./users/user-detail/user-detail").then(
						(m) => m.UserDetailPage
					),
				title: "User Details - SeventySix"
			}
		]
	},
	{
		path: "permission-requests",
		providers: [PermissionRequestService, PermissionRequestRepository],
		loadComponent: () =>
			import(
				"./permission-requests/permission-request-list/permission-request-list"
			).then((m) => m.PermissionRequestListPage),
		title: "Permission Requests - SeventySix"
	},
	{
		path: "not-found",
		loadComponent: () =>
			import("@shared/error-pages/not-found/not-found").then(
				(m) => m.NotFoundPage
			),
		title: "Page Not Found - SeventySix"
	},
	{
		path: "server-error",
		loadComponent: () =>
			import("@shared/error-pages/server-error/server-error").then(
				(m) => m.ServerErrorPage
			),
		title: "Server Error - SeventySix"
	}
];
