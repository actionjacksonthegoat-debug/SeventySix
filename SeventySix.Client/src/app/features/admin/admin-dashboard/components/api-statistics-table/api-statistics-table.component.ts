import {
	Component,
	signal,
	WritableSignal,
	ChangeDetectionStrategy,
	inject,
	computed,
	Signal
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { ThirdPartyApiService } from "@admin/admin-dashboard/services";
import { ThirdPartyApiRequest } from "@admin/admin-dashboard/models";
import { DateService } from "@core/services/date.service";

/**
 * Extended interface with computed display properties
 */
interface ThirdPartyApiRequestDisplay extends ThirdPartyApiRequest
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
		CommonModule,
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
	private readonly dateService: DateService = inject(DateService);

	/**
	 * TanStack Query for API data
	 */
	readonly apiDataQuery: ReturnType<
		ThirdPartyApiService["getAllThirdPartyApis"]
	> = this.thirdPartyApiService.getAllThirdPartyApis();

	/**
	 * Loading state from query
	 */
	readonly isLoading: Signal<boolean> = computed(() =>
		this.apiDataQuery.isLoading()
	);

	/**
	 * Error state from query
	 */
	readonly error: Signal<string | null> = computed(() =>
	{
		const err: Error | null = this.apiDataQuery.error();
		return err ? err.message || "Failed to load API data" : null;
	});

	/**
	 * Data source with computed display properties
	 */
	readonly dataSource: Signal<
		MatTableDataSource<ThirdPartyApiRequestDisplay>
	> = computed(() =>
	{
		const data: ThirdPartyApiRequest[] = this.apiDataQuery.data() ?? [];
		const displayData: ThirdPartyApiRequestDisplay[] = data.map((item) => ({
			...item,
			formattedLastCalled: this.formatLastCalled(item.lastCalledAt),
			status: this.getStatus(item.lastCalledAt)
		}));
		return new MatTableDataSource<ThirdPartyApiRequestDisplay>(displayData);
	});

	/**
	 * Displayed columns
	 */
	readonly displayedColumns: WritableSignal<string[]> = signal<string[]>([
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
	getStatus(timestamp: string | null): string
	{
		if (!timestamp) return "error";

		const hoursSince: number = this.dateService.hoursSince(timestamp);

		if (hoursSince < 1) return "ok";
		if (hoursSince < 24) return "warning";
		return "error";
	}

	/**
	 * Format last called timestamp
	 */
	formatLastCalled(timestamp: string | null): string
	{
		if (!timestamp) return "Never";

		return this.dateService.formatRelative(timestamp);
	}
}
