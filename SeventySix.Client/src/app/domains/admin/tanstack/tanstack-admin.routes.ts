import { HealthApiService } from "@admin/services";
import { TanStackDashboardService, TanStackLogService } from "@admin/tanstack/services";
import { Routes } from "@angular/router";

/**
 * TanStack admin section child routes.
 * Provides TanStack-specific services at route level.
 */
export const TANSTACK_ADMIN_ROUTES: Routes =
	[
		{
			path: "",
			providers: [
				TanStackDashboardService,
				HealthApiService
			],
			loadComponent: () =>
				import("./pages/tanstack-dashboard/tanstack-dashboard").then(
					(mod) => mod.TanStackDashboardPage),
			title: "TanStack Dashboard - SeventySix"
		},
		{
			path: "logs",
			providers: [TanStackLogService],
			loadComponent: () =>
				import("./pages/tanstack-logs/tanstack-logs").then(
					(mod) => mod.TanStackLogsPage),
			title: "TanStack Logs - SeventySix"
		}
	];