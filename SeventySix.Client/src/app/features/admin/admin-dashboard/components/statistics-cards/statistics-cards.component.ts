import {
	Component,
	signal,
	computed,
	Signal,
	WritableSignal,
	inject
} from "@angular/core";
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
export class StatisticsCardsComponent
{
	private readonly logChartService = inject(LogChartService);

	/**
	 * TanStack Query for statistics
	 */
	readonly statisticsQuery = this.logChartService.createStatisticsQuery();

	/**
	 * Loading state from query
	 */
	readonly isLoading: Signal<boolean> = computed(() =>
		this.statisticsQuery.isLoading()
	);

	/**
	 * Error state from query
	 */
	readonly error: Signal<string | null> = computed(() =>
	{
		const err = this.statisticsQuery.error();
		return err ? err.message || "Failed to load statistics" : null;
	});

	/**
	 * Statistics data from query
	 */
	private readonly statistics: Signal<LogStatistics | null> = computed(
		() => this.statisticsQuery.data() ?? null
	);

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

	/**
	 * Handle refresh button click
	 */
	onRefresh(): void
	{
		this.statisticsQuery.refetch();
	}
}
