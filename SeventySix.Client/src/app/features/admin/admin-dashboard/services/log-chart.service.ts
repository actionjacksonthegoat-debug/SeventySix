import {
	Injectable,
	inject,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import {
	injectQuery,
	QueryClient,
	CreateQueryResult
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { LogChartRepository } from "../repositories";
import { LogChartData } from "../models";
import { LogStatistics } from "@admin/log-management/models";
import { getQueryConfig } from "@core/utils/query-config";

/**
 * Service for managing log chart data and statistics
 * Uses TanStack Query for caching and state management
 */
@Injectable({
	providedIn: "root"
})
export class LogChartService
{
	private readonly repository: LogChartRepository =
		inject(LogChartRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("logs");

	/**
	 * Creates a query for log chart data for the specified period signal
	 * @param period - Signal containing time period (24h, 7d, 30d)
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createChartDataQuery(
		period: Signal<string>
	): CreateQueryResult<LogChartData, Error>
	{
		return injectQuery(() => ({
			queryKey: ["logs", "chartData", period()],
			queryFn: () =>
				lastValueFrom(this.repository.getChartData(period())),
			...this.queryConfig
		}));
	}

	/**
	 * Creates a query for log statistics
	 * @returns Query object with data, isLoading, error, etc.
	 */
	createStatisticsQuery(): CreateQueryResult<LogStatistics, Error>
	{
		return injectQuery(() => ({
			queryKey: ["logs", "statistics"],
			queryFn: () => lastValueFrom(this.repository.getStatistics()),
			...this.queryConfig
		}));
	}
}
