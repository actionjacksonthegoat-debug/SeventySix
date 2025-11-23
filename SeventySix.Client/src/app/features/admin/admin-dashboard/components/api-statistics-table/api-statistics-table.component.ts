import {
	Component,
	OnInit,
	signal,
	WritableSignal,
	ChangeDetectionStrategy,
	inject
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
export class ApiStatisticsTableComponent implements OnInit
{
	/**
	 * Loading state signal
	 */
	readonly isLoading: WritableSignal<boolean> = signal<boolean>(true);

	/**
	 * Error state signal
	 */
	readonly error: WritableSignal<string | null> = signal<string | null>(null);

	/**
	 * Table data source
	 */
	readonly dataSource: WritableSignal<
		MatTableDataSource<ThirdPartyApiRequestDisplay>
	> = signal<MatTableDataSource<ThirdPartyApiRequestDisplay>>(
		new MatTableDataSource<ThirdPartyApiRequestDisplay>([])
	);

	/**
	 * Displayed columns
	 */
	readonly displayedColumns: WritableSignal<string[]> = signal<string[]>([
		"apiName",
		"callCount",
		"lastCalledAt"
	]);

	private readonly thirdPartyApiService: ThirdPartyApiService =
		inject(ThirdPartyApiService);
	private readonly dateService: DateService = inject(DateService);

	ngOnInit(): void
	{
		this.loadApiData();
	}

	/**
	 * Load API data from service
	 */
	private loadApiData(): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		this.thirdPartyApiService.getAll().subscribe({
			next: (data) =>
			{
				// Pre-compute display properties to avoid change detection issues
				const displayData: ThirdPartyApiRequestDisplay[] = data.map(
					(item) => ({
						...item,
						formattedLastCalled: this.formatLastCalled(
							item.lastCalledAt
						),
						status: this.getStatus(item.lastCalledAt)
					})
				);

				this.dataSource().data = displayData;
				this.isLoading.set(false);
			},
			error: (err) =>
			{
				this.error.set(err.message || "Failed to load API data");
				this.dataSource().data = [];
				this.isLoading.set(false);
			}
		});
	}

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.loadApiData();
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
