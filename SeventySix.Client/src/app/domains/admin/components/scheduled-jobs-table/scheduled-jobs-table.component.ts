import { RecurringJobStatusResponse } from "@admin/models";
import { HealthApiService } from "@admin/services";
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
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

/**
 * Extended interface with computed display properties.
 */
interface ScheduledJobDisplay extends RecurringJobStatusResponse
{
	/** Formatted last executed time for display. */
	formattedLastExecuted: string;
	/** Formatted next scheduled time for display. */
	formattedNextScheduled: string;
	/** Material icon name for the status. */
	statusIcon: string;
	/** CSS class for status styling. */
	statusClass: string;
}

/**
 * Component for displaying scheduled background job statuses in a table.
 */
@Component(
	{
		selector: "app-scheduled-jobs-table",
		imports: [
			MatTableModule,
			MatCardModule,
			MatIconModule,
			MatProgressSpinnerModule,
			MatButtonModule,
			NgxSkeletonLoaderModule
		],
		templateUrl: "./scheduled-jobs-table.component.html",
		styleUrl: "./scheduled-jobs-table.component.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class ScheduledJobsTableComponent
{
	/**
	 * Service for retrieving scheduled job statuses.
	 * @type {HealthApiService}
	 * @private
	 * @readonly
	 */
	private readonly healthApiService: HealthApiService =
		inject(HealthApiService);

	/**
	 * Date service used to format timestamps for display.
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
	 * TanStack Query for scheduled job data.
	 * @type {ReturnType<typeof this.healthApiService.getScheduledJobs>}
	 */
	readonly jobsQuery: ReturnType<typeof this.healthApiService.getScheduledJobs> =
		this
			.healthApiService
			.getScheduledJobs();

	/**
	 * Loading state derived from the query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.jobsQuery.isLoading());

	/**
	 * Human-friendly error message for display when the query fails.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			() =>
			{
				const queryError: Error | null =
					this.jobsQuery.error();
				return queryError
					? queryError.message || "Failed to load scheduled job data"
					: null;
			});

	/**
	 * Data source with computed display properties.
	 * @type {Signal<MatTableDataSource<ScheduledJobDisplay>>}
	 */
	readonly dataSource: Signal<MatTableDataSource<ScheduledJobDisplay>> =
		computed(
			() =>
			{
				const data: RecurringJobStatusResponse[] =
					this.jobsQuery.data() ?? [];
				const displayData: ScheduledJobDisplay[] =
					data.map(
						(jobStatus) => ({
							...jobStatus,
							formattedLastExecuted: this.formatTimestamp(jobStatus.lastExecutedAt),
							formattedNextScheduled: this.formatTimestamp(jobStatus.nextScheduledAt),
							statusIcon: this.getStatusIcon(jobStatus.status),
							statusClass: this.getStatusClass(jobStatus.status)
						}));
				return new MatTableDataSource<ScheduledJobDisplay>(displayData);
			});

	/**
	 * Displayed columns configuration.
	 * @type {WritableSignal<string[]>}
	 */
	readonly displayedColumns: WritableSignal<string[]> =
		signal<string[]>(
			[
				"displayName",
				"status",
				"lastExecutedAt",
				"nextScheduledAt",
				"interval"
			]);

	/**
	 * Refresh the scheduled jobs query.
	 * @returns {void}
	 */
	onRefresh(): void
	{
		this.jobsQuery.refetch();
	}

	/**
	 * Get the Material icon name for a status.
	 * @param {string | null | undefined} status
	 * The health status string.
	 * @returns {string}
	 * Material icon name.
	 */
	getStatusIcon(status: string | null | undefined): string
	{
		switch (status)
		{
			case "Healthy":
				return "check_circle";
			case "Degraded":
				return "warning";
			case "Unknown":
			default:
				return "help_outline";
		}
	}

	/**
	 * Get the CSS class for status styling.
	 * @param {string | null | undefined} status
	 * The health status string.
	 * @returns {string}
	 * CSS class name.
	 */
	getStatusClass(status: string | null | undefined): string
	{
		switch (status)
		{
			case "Healthy":
				return "status-healthy";
			case "Degraded":
				return "status-degraded";
			case "Unknown":
			default:
				return "status-unknown";
		}
	}

	/**
	 * Format a timestamp as a human-readable relative string.
	 * @param {string | null | undefined} timestamp
	 * ISO timestamp or null.
	 * @returns {string}
	 * Human-friendly relative time or 'Never'.
	 */
	formatTimestamp(timestamp: string | null | undefined): string
	{
		if (!timestamp) return "Never";

		return this.dateService.formatRelative(timestamp);
	}
}
