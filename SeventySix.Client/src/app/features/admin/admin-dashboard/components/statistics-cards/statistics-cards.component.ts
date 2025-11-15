import { Component, OnInit, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatButtonModule } from "@angular/material/button";
import { LogChartService } from "@admin/admin-dashboard/services";
import { LogStatistics } from "@admin/log-management/models";
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
	readonly isLoading: WritableSignal<boolean> = signal<boolean>(true);

	/**
	 * Error state signal
	 */
	readonly error: WritableSignal<string | null> = signal<string | null>(null);

	/**
	 * Statistics data signal
	 */
	readonly statistics: WritableSignal<LogStatistics | null> =
		signal<LogStatistics | null>(null);

	/**
	 * Computed error count
	 */
	readonly errorCount: Signal<number> = computed(
		() => this.statistics()?.errorCount ?? 0
	);

	/**
	 * Computed warning count
	 */
	readonly warningCount: Signal<number> = computed(
		() => this.statistics()?.warningCount ?? 0
	);

	/**
	 * Computed fatal count
	 */
	readonly fatalCount: Signal<number> = computed(
		() => this.statistics()?.criticalCount ?? 0
	);

	/**
	 * Computed info count
	 */
	readonly infoCount: Signal<number> = computed(
		() => this.statistics()?.infoCount ?? 0
	);

	/**
	 * Computed debug count
	 */
	readonly debugCount: Signal<number> = computed(
		() => this.statistics()?.debugCount ?? 0
	);

	/**
	 * Computed total count
	 */
	readonly totalCount: Signal<number> = computed(
		() => this.statistics()?.totalLogs ?? 0
	);

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
