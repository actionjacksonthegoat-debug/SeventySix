import { GrafanaDashboardEmbedComponent } from "@admin/components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { PagedResultOfLogDto } from "@admin/logs/models";
import { TANSTACK_ADMIN_ROUTES as TANSTACK_ROUTES } from "@admin/tanstack/constants";
import { TanStackDashboardService } from "@admin/tanstack/services";
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
 * TanStack admin dashboard page.
 * Displays Grafana dashboards (Performance + Commerce tabs)
 * and warning/error log counts for the TanStack sandbox.
 */
@Component(
	{
		selector: "app-tanstack-dashboard",
		imports: [
			PageHeaderComponent,
			MatProgressSpinnerModule,
			MatTabsModule,
			RouterLink,
			GrafanaDashboardEmbedComponent,
			...CARD_MATERIAL_MODULES
		],
		templateUrl: "./tanstack-dashboard.html",
		styleUrl: "./tanstack-dashboard.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class TanStackDashboardPage
{
	/**
	 * Dashboard service for TanStack data and Grafana UIDs.
	 * @type {TanStackDashboardService}
	 * @private
	 * @readonly
	 */
	private readonly dashboardService: TanStackDashboardService =
		inject(TanStackDashboardService);

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
	 * Query result for TanStack warning logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly warnings: CreateQueryResult<PagedResultOfLogDto, Error> =
		this.dashboardService.getWarnings();

	/**
	 * Query result for TanStack error logs.
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
	 * Route path to the TanStack logs page.
	 * @type {string}
	 * @readonly
	 */
	readonly logsRoute: string =
		TANSTACK_ROUTES.LOGS;
}