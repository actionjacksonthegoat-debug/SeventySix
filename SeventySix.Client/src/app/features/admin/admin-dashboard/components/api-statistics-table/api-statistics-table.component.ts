import { ThirdPartyApiRequestResponse } from "@admin/admin-dashboard/models";
import { ThirdPartyApiService } from "@admin/admin-dashboard/services";
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
import { DateService } from "@infrastructure/services/date.service";

/**
 * Extended interface with computed display properties
 */
interface ThirdPartyApiRequestDisplay extends ThirdPartyApiRequestResponse
{
	formattedLastCalled: string;
	status: string;
}

/**
 * Component for displaying third-party API statistics in a table
 */
@Component({
	selector: "app-api-statistics-table",
	imports: [
		MatTableModule,
		MatCardModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatButtonModule
	],
	templateUrl: "./api-statistics-table.component.html",
	styleUrl: "./api-statistics-table.component.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApiStatisticsTableComponent
{
	private readonly thirdPartyApiService: ThirdPartyApiService =
		inject(ThirdPartyApiService);
	private readonly dateService: DateService =
		inject(DateService);

	/**
	 * TanStack Query for API data
	 */
	readonly apiDataQuery: ReturnType<
		ThirdPartyApiService["getAllThirdPartyApis"]> =
		this.thirdPartyApiService.getAllThirdPartyApis();

	/**
	 * Loading state from query
	 */
	readonly isLoading: Signal<boolean> =
		computed(() => this.apiDataQuery.isLoading());

	/**
	 * Error state from query
	 */
	readonly error: Signal<string | null> =
		computed(() =>
	{
		const err: Error | null =
			this.apiDataQuery.error();
		return err ? err.message || "Failed to load API data" : null;
	});

	/**
	 * Data source with computed display properties
	 */
	readonly dataSource: Signal<
		MatTableDataSource<ThirdPartyApiRequestDisplay>> =
		computed(() =>
	{
		const data: ThirdPartyApiRequestResponse[] =
			this.apiDataQuery.data() ?? [];
		const displayData: ThirdPartyApiRequestDisplay[] =
			data.map((item) => ({
			...item,
			formattedLastCalled: this.formatLastCalled(item.lastCalledAt),
			status: this.getStatus(item.lastCalledAt)
		}));
		return new MatTableDataSource<ThirdPartyApiRequestDisplay>(displayData);
	});

	/**
	 * Displayed columns
	 */
	readonly displayedColumns: WritableSignal<string[]> =
		signal<string[]>([
		"apiName",
		"callCount",
		"lastCalledAt"
	]);

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.apiDataQuery.refetch();
	}

	/**
	 * Get status based on last called timestamp
	 */
	getStatus(timestamp: string | null | undefined): string
	{
		if (!timestamp) return "error";

		const hoursSince: number =
			this.dateService.hoursSince(timestamp);

		if (hoursSince < 1) return "ok";
		if (hoursSince < 24) return "warning";
		return "error";
	}

	/**
	 * Format last called timestamp
	 */
	formatLastCalled(timestamp: string | null | undefined): string
	{
		if (!timestamp) return "Never";

		return this.dateService.formatRelative(timestamp);
	}
}
