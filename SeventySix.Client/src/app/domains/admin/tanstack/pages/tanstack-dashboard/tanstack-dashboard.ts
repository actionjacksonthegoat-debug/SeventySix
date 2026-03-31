import { GrafanaDashboardEmbedComponent } from "@admin/components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { TanStackDashboardService } from "@admin/tanstack/services";
import {
	ChangeDetectionStrategy,
	Component,
	inject
} from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { PageHeaderComponent } from "@shared/components";

/**
 * TanStack admin dashboard page.
 * Displays Grafana dashboards (Performance + Commerce tabs)
 * for the TanStack sandbox.
 */
@Component(
	{
		selector: "app-tanstack-dashboard",
		imports: [
			PageHeaderComponent,
			MatTabsModule,
			GrafanaDashboardEmbedComponent
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
}