import { GrafanaDashboardEmbedComponent } from "@admin/components/grafana-dashboard-embed/grafana-dashboard-embed.component";
import { SvelteDashboardService } from "@admin/svelte/services";
import {
	ChangeDetectionStrategy,
	Component,
	inject
} from "@angular/core";
import { MatTabsModule } from "@angular/material/tabs";
import { PageHeaderComponent } from "@shared/components";

/**
 * SvelteKit admin dashboard page.
 * Displays Grafana dashboards (Performance + Commerce tabs)
 * for the SvelteKit sandbox.
 */
@Component(
	{
		selector: "app-svelte-dashboard",
		imports: [
			PageHeaderComponent,
			MatTabsModule,
			GrafanaDashboardEmbedComponent
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
}