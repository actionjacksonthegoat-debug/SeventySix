import { GrafanaDashboardEmbedComponent } from "@admin/components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { PagedResultOfLogDto } from "@admin/logs/models";
import { SVELTE_ADMIN_ROUTES as SVELTE_ROUTES } from "@admin/svelte/constants";
import { SvelteDashboardService } from "@admin/svelte/services";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal
} from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTabsModule } from "@angular/material/tabs";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { CreateQueryResult } from "@tanstack/angular-query-experimental";

/**
 * SvelteKit admin dashboard page.
 * Displays Grafana dashboards (Performance + Commerce tabs)
 * and warning/error log counts for the SvelteKit sandbox.
 */
@Component(
	{
		selector: "app-svelte-dashboard",
		imports: [
			PageHeaderComponent,
			MatProgressSpinnerModule,
			MatTabsModule,
			RouterLink,
			GrafanaDashboardEmbedComponent,
			...CARD_MATERIAL_MODULES
		],
		templateUrl: "./svelte-dashboard.html",
		styleUrl: "./svelte-dashboard.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SvelteDashboardPage
{
	/**
	 * Dashboard service for SvelteKit data and Grafana UIDs.
	 * @type {SvelteDashboardService}
	 * @private
	 * @readonly
	 */
	private readonly dashboardService: SvelteDashboardService =
		inject(SvelteDashboardService);

	/**
	 * Grafana dashboard UID for the performance dashboard.
	 * @type {string}
	 * @readonly
	 */
	readonly performanceDashboardUid: string =
		this.dashboardService.getDashboardUid("performance");

	/**
	 * Grafana dashboard UID for the commerce dashboard.
	 * @type {string}
	 * @readonly
	 */
	readonly commerceDashboardUid: string =
		this.dashboardService.getDashboardUid("commerce");

	/**
	 * Query result for SvelteKit warning logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly warnings: CreateQueryResult<PagedResultOfLogDto, Error> =
		this.dashboardService.getWarnings();

	/**
	 * Query result for SvelteKit error logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly errors: CreateQueryResult<PagedResultOfLogDto, Error> =
		this.dashboardService.getErrors();

	/**
	 * Computed warning count from query result.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly warningCount: Signal<number> =
		computed(
			() =>
				this.warnings.data()?.totalCount ?? 0);

	/**
	 * Computed error count from query result.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly errorCount: Signal<number> =
		computed(
			() =>
				this.errors.data()?.totalCount ?? 0);

	/**
	 * Whether any query is still loading.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() =>
				this.warnings.isLoading()
					|| this.errors.isLoading());

	/**
	 * Route path to the SvelteKit logs page.
	 * @type {string}
	 * @readonly
	 */
	readonly logsRoute: string =
		SVELTE_ROUTES.LOGS;
}