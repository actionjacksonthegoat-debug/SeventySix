import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { ThirdPartyApiService } from "@core/services/admin";
import { ThirdPartyApiRequest } from "@core/models/admin";

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
		MatButtonModule,
		MatChipsModule
	],
	templateUrl: "./api-statistics-table.component.html",
	styleUrl: "./api-statistics-table.component.scss"
})
export class ApiStatisticsTableComponent implements OnInit
{
	/**
	 * Loading state signal
	 */
	isLoading = signal<boolean>(true);

	/**
	 * Error state signal
	 */
	error = signal<string | null>(null);

	/**
	 * Table data source
	 */
	dataSource = signal<MatTableDataSource<ThirdPartyApiRequest>>(
		new MatTableDataSource<ThirdPartyApiRequest>([])
	);

	/**
	 * Displayed columns
	 */
	displayedColumns = signal<string[]>([
		"apiName",
		"callCount",
		"lastCalledAt",
		"status"
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
				this.dataSource().data = data;
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
	 * Format last called timestamp
	 */
	formatLastCalled(timestamp: string | null): string
	{
		if (!timestamp) return "Never";

		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

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

	/**
	 * Get status based on last called time
	 */
	getStatus(lastCalledAt: string | null): "ok" | "warning" | "error"
	{
		if (!lastCalledAt) return "error";

		const date = new Date(lastCalledAt);
		const now = new Date();
		const diffHours = (now.getTime() - date.getTime()) / 3600000;

		if (diffHours < 1) return "ok";
		if (diffHours < 24) return "warning";
		return "error";
	}
}
