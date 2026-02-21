/**
 * Admin Feature Routes
 * Lazy-loaded routes for admin-only features
 * Services are provided at route level for proper garbage collection
 */
import { LogManagementService } from "@admin/logs/services";
import { PermissionRequestService } from "@admin/permission-requests/services";
import {
	HealthApiService,
	ThirdPartyApiService
} from "@admin/services";
import {
	UserExportService,
	UserPreferencesService,
	UserService
} from "@admin/users/services";
import { Routes } from "@angular/router";

/**
 * Admin feature routes including logs, users, and dashboard.
 * Services are provided at route level to scope DI lifetimes per-feature.
 */
export const ADMIN_ROUTES: Routes =
	[
		{
			path: "",
			redirectTo: "dashboard",
			pathMatch: "full"
		},
		{
			path: "logs",
			providers: [LogManagementService],
			loadComponent: () =>
				import("./logs/pages/log-management/log-management").then(
					(m) => m.LogManagementPage),
			title: "Log Management - SeventySix"
		},
		{
			path: "dashboard",
			providers: [
				ThirdPartyApiService,
				HealthApiService
			],
			loadComponent: () =>
				import("./pages/admin-dashboard/admin-dashboard").then(
					(m) => m.AdminDashboardPage),
			title: "Admin Dashboard - SeventySix"
		},
		{
			path: "users",
			providers: [
				UserService,
				UserExportService,
				UserPreferencesService
			],
			children: [
				{
					path: "",
					loadComponent: () =>
						import("./users/pages/user-management/user-management").then(
							(m) => m.UserManagementPage),
					title: "User Management - SeventySix"
				},
				{
					path: "create",
					loadComponent: () =>
						import("./users/pages/user-create/user-create").then(
							(m) => m.UserCreatePage),
					title: "Create User - SeventySix"
				},
				{
					path: ":id",
					loadComponent: () =>
						import("./users/pages/user-detail/user-detail").then(
							(m) => m.UserDetailPage),
					title: "User Details - SeventySix"
				}
			]
		},
		{
			path: "permission-requests",
			providers: [PermissionRequestService],
			loadComponent: () =>
				import(
					"./permission-requests/pages/permission-request-list/permission-request-list")
					.then(
						(m) => m.PermissionRequestListPage),
			title: "Permission Requests - SeventySix"
		},
		{
			path: "not-found",
			loadComponent: () =>
				import("@shared/pages/not-found/not-found").then(
					(m) => m.NotFoundPage),
			title: "Page Not Found - SeventySix"
		},
		{
			path: "server-error",
			loadComponent: () =>
				import("@shared/pages/server-error/server-error").then(
					(m) => m.ServerErrorPage),
			title: "Server Error - SeventySix"
		}
	];