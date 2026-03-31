import { HealthApiService } from "@admin/services";
import { SvelteDashboardService, SvelteLogService } from "@admin/svelte/services";
import { Routes } from "@angular/router";

/**
 * SvelteKit admin section child routes.
 * Provides SvelteKit-specific services at route level.
 */
export const SVELTE_ADMIN_ROUTES: Routes =
	[
		{
			path: "",
			providers: [
				SvelteDashboardService,
				HealthApiService
			],
			loadComponent: () =>
				import("./pages/svelte-dashboard/svelte-dashboard").then(
					(mod) => mod.SvelteDashboardPage),
			title: "SvelteKit Dashboard - SeventySix"
		},
		{
			path: "logs",
			providers: [SvelteLogService],
			loadComponent: () =>
				import("./pages/svelte-logs/svelte-logs").then(
					(mod) => mod.SvelteLogsPage),
			title: "SvelteKit Logs - SeventySix"
		}
	];