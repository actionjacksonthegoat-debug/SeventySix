import { SANDBOX_SOURCES } from "@admin/constants";
import { PagedResultOfLogDto } from "@admin/logs/models";
import { SandboxDashboardService } from "@admin/services/sandbox-dashboard.service";
import { ChangeDetectionStrategy, Component, computed, inject, Signal } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { PageHeaderComponent } from "@shared/components";
import { CARD_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { CreateQueryResult } from "@tanstack/angular-query-experimental";

/**
 * Sandbox container health monitor page.
 * Displays recent warning/error log counts for SvelteKit and TanStack sandbox apps.
 * Provides quick links to sandbox sites and filtered log views.
 */
@Component(
	{
		selector: "app-sandbox-dashboard",
		imports: [
			PageHeaderComponent,
			MatProgressSpinnerModule,
			RouterLink,
			...CARD_MATERIAL_MODULES
		],
		templateUrl: "./sandbox-dashboard.html",
		styleUrl: "./sandbox-dashboard.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class SandboxDashboardPage
{
	/**
	 * Service for fetching sandbox log data.
	 * @type {SandboxDashboardService}
	 * @private
	 * @readonly
	 */
	private readonly dashboardService: SandboxDashboardService =
		inject(SandboxDashboardService);

	/**
	 * Query result for SvelteKit warning logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly svelteKitWarnings: CreateQueryResult<PagedResultOfLogDto, Error> =
		this
			.dashboardService
			.getSvelteKitWarnings();

	/**
	 * Query result for SvelteKit error logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly svelteKitErrors: CreateQueryResult<PagedResultOfLogDto, Error> =
		this
			.dashboardService
			.getSvelteKitErrors();

	/**
	 * Query result for TanStack warning logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly tanStackWarnings: CreateQueryResult<PagedResultOfLogDto, Error> =
		this
			.dashboardService
			.getTanStackWarnings();

	/**
	 * Query result for TanStack error logs.
	 * @type {CreateQueryResult<PagedResultOfLogDto, Error>}
	 * @readonly
	 */
	readonly tanStackErrors: CreateQueryResult<PagedResultOfLogDto, Error> =
		this.dashboardService.getTanStackErrors();

	/**
	 * Computed warning count for SvelteKit sandbox.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly svelteKitWarningCount: Signal<number> =
		computed(
			() =>
				this.svelteKitWarnings.data()?.totalCount ?? 0);

	/**
	 * Computed error count for SvelteKit sandbox.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly svelteKitErrorCount: Signal<number> =
		computed(
			() =>
				this.svelteKitErrors.data()?.totalCount ?? 0);

	/**
	 * Computed warning count for TanStack sandbox.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly tanStackWarningCount: Signal<number> =
		computed(
			() =>
				this.tanStackWarnings.data()?.totalCount ?? 0);

	/**
	 * Computed error count for TanStack sandbox.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly tanStackErrorCount: Signal<number> =
		computed(
			() =>
				this.tanStackErrors.data()?.totalCount ?? 0);

	/**
	 * Whether any query is still loading.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() =>
				this.svelteKitWarnings.isLoading()
					|| this.svelteKitErrors.isLoading()
					|| this.tanStackWarnings.isLoading()
					|| this.tanStackErrors.isLoading());

	/**
	 * Source context identifier for SvelteKit sandbox log filtering.
	 * @type {string}
	 * @readonly
	 */
	readonly svelteKitSource: string =
		SANDBOX_SOURCES.SVELTEKIT;

	/**
	 * Source context identifier for TanStack sandbox log filtering.
	 * @type {string}
	 * @readonly
	 */
	readonly tanStackSource: string =
		SANDBOX_SOURCES.TANSTACK;
}