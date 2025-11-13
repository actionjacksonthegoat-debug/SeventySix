import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { LogChartService } from "@features/admin/services";
import { LogStatistics } from "@core/models/admin";
import {
	fadeInUp,
	staggerList
} from "@shared/animations/admin-dashboard.animations";

/**
 * Component for displaying statistics cards with key metrics
 */
@Component({
	selector: "app-statistics-cards",
	imports: [
		CommonModule,
		MatCardModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatButtonModule
	],
	templateUrl: "./statistics-cards.component.html",
	styleUrl: "./statistics-cards.component.scss",
	animations: [fadeInUp, staggerList]
})
export class StatisticsCardsComponent implements OnInit
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
	 * Statistics data signal
	 */
	statistics = signal<LogStatistics | null>(null);

	/**
	 * Computed error count
	 */
	errorCount = computed(() => this.statistics()?.errorCount ?? 0);

	/**
	 * Computed warning count
	 */
	warningCount = computed(() => this.statistics()?.warningCount ?? 0);

	/**
	 * Computed fatal count
	 */
	fatalCount = computed(() => this.statistics()?.criticalCount ?? 0);

	/**
	 * Computed info count
	 */
	infoCount = computed(() => this.statistics()?.infoCount ?? 0);

	/**
	 * Computed debug count
	 */
	debugCount = computed(() => this.statistics()?.debugCount ?? 0);

	/**
	 * Computed total count
	 */
	totalCount = computed(() => this.statistics()?.totalLogs ?? 0);

	constructor(private readonly logChartService: LogChartService)
	{}

	ngOnInit(): void
	{
		this.loadStatistics();
	}

	/**
	 * Load statistics from API
	 */
	private loadStatistics(): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		this.logChartService.getStatistics().subscribe({
			next: (stats) =>
			{
				this.statistics.set(stats);
				this.isLoading.set(false);
			},
			error: (err) =>
			{
				this.error.set(err.message || "Failed to load statistics");
				this.statistics.set(null);
				this.isLoading.set(false);
			}
		});
	}

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.loadStatistics();
	}
}
