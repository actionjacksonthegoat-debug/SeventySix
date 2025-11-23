import {
	Component,
	OnInit,
	signal,
	WritableSignal,
	ChangeDetectionStrategy
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { ThirdPartyApiService } from "@admin/admin-dashboard/services";
import { ThirdPartyApiRequest } from "@admin/admin-dashboard/models";

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

	constructor(private readonly thirdPartyApiService: ThirdPartyApiService)
	{}

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

		const date: Date = new Date(timestamp);
		const now: Date = new Date();
		const diffMs: number = now.getTime() - date.getTime();
		const diffHours: number = Math.floor(diffMs / 3600000);

		if (diffHours < 1) return "ok";
		if (diffHours < 24) return "warning";
		return "error";
	}

	/**
	 * Format last called timestamp
	 */
	formatLastCalled(timestamp: string | null): string
	{
		if (!timestamp) return "Never";

		const date: Date = new Date(timestamp);
		const now: Date = new Date();
		const diffMs: number = now.getTime() - date.getTime();
		const diffMins: number = Math.floor(diffMs / 60000);
		const diffHours: number = Math.floor(diffMs / 3600000);
		const diffDays: number = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins} min ago`;
		if (diffHours < 24) return `${diffHours} hr ago`;
		if (diffDays < 7)
			return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric"
		});
	}
}
