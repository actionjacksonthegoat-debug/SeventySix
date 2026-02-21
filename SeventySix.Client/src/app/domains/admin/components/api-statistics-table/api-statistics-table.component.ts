import { ThirdPartyApiRequestDto } from "@admin/models";
import { ThirdPartyApiService } from "@admin/services";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { SKELETON_TABLE_CELL, SkeletonTheme } from "@shared/constants";
import { DateService } from "@shared/services/date.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

/**
 * Extended interface with computed display properties
 */
interface ThirdPartyApiRequestDisplay extends ThirdPartyApiRequestDto
{
	formattedLastCalled: string;
	status: string;
}

/**
 * Component for displaying third-party API statistics in a table
 */
@Component(
	{
		selector: "app-api-statistics-table",
		imports: [
			MatTableModule,
			MatCardModule,
			MatIconModule,
			MatProgressSpinnerModule,
			MatButtonModule,
			NgxSkeletonLoaderModule
		],
		templateUrl: "./api-statistics-table.component.html",
		styleUrl: "./api-statistics-table.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class ApiStatisticsTableComponent
{
	/**
	 * Service for retrieving third-party API statistics and performing related operations.
	 * @type {ThirdPartyApiService}
	 * @private
	 * @readonly
	 */
	private readonly thirdPartyApiService: ThirdPartyApiService =
		inject(ThirdPartyApiService);

	/**
	 * Date service used to compute relative times and format timestamps for display.
	 * @type {DateService}
	 * @private
	 * @readonly
	 */
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * Skeleton theme for table cells.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonTableCell: SkeletonTheme = SKELETON_TABLE_CELL;

	/**
	 * TanStack Query for API data (contains data/isLoading/error flags).
	 * @type {ReturnType<ThirdPartyApiService["getAllThirdPartyApis"]>}
	 */
	readonly apiDataQuery: ReturnType<
		ThirdPartyApiService["getAllThirdPartyApis"]> =
		this.thirdPartyApiService.getAllThirdPartyApis();

	/**
	 * Loading state derived from the query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.apiDataQuery.isLoading());

	/**
	 * Human-friendly error message for display when the query fails.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			() =>
			{
				const queryError: Error | null =
					this.apiDataQuery.error();
				return queryError ? queryError.message ?? "Failed to load API data" : null;
			});

	/**
	 * Data source with computed display properties (formatted dates and status).
	 * @type {Signal<MatTableDataSource<ThirdPartyApiRequestDisplay>>}
	 */
	readonly dataSource: Signal<
		MatTableDataSource<ThirdPartyApiRequestDisplay>> =
		computed(
			() =>
			{
				const data: ThirdPartyApiRequestDto[] =
					this.apiDataQuery.data() ?? [];
				const displayData: ThirdPartyApiRequestDisplay[] =
					data.map(
						(item) => ({
							...item,
							formattedLastCalled: this.formatLastCalled(item.lastCalledAt),
							status: this.getStatus(item.lastCalledAt)
						}));
				return new MatTableDataSource<ThirdPartyApiRequestDisplay>(displayData);
			});

	/**
	 * Displayed columns
	 * @type {WritableSignal<string[]>}
	 */
	readonly displayedColumns: WritableSignal<string[]> =
		signal<string[]>(
			[
				"apiName",
				"callCount",
				"lastCalledAt"
			]);

	/**
	 * Refresh the API data query.
	 * @returns {void}
	 */
	onRefresh(): void
	{
		this.apiDataQuery.refetch();
	}

	/**
	 * Determine a status value (ok|warning|error) based on hours since last call.
	 * @param {string | null | undefined} timestamp
	 * ISO timestamp when API was last called.
	 * @returns {string}
	 * Status string used for UI badges ('ok'|'warning'|'error').
	 */
	getStatus(timestamp: string | null | undefined): string
	{
		if (isNullOrUndefined(timestamp)) return "error";

		const hoursSince: number =
			this.dateService.hoursSince(timestamp);

		if (hoursSince < 1) return "ok";
		if (hoursSince < 24) return "warning";
		return "error";
	}

	/**
	 * Format the last called timestamp as a human-readable relative string.
	 * @param {string | null | undefined} timestamp
	 * ISO timestamp or null.
	 * @returns {string}
	 * Human-friendly relative time or 'Never'.
	 */
	formatLastCalled(timestamp: string | null | undefined): string
	{
		if (isNullOrUndefined(timestamp)) return "Never";

		return this.dateService.formatRelative(timestamp);
	}
}