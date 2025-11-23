import { Injectable, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiService } from "@core/api-services/api.service";
import { LogChartData } from "../models";
import { LogStatistics } from "@admin/log-management/models";

/**
 * Repository for log chart data access
 * Follows Repository pattern for data access abstraction
 */
@Injectable({
	providedIn: "root"
})
export class LogChartRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "logs";

	/**
	 * Gets log chart data for the specified period
	 * @param period - Time period (24h, 7d, 30d). Defaults to 24h
	 * @returns Observable of LogChartData
	 */
	getChartData(period: string = "24h"): Observable<LogChartData>
	{
		const params: HttpParams = new HttpParams().set("period", period);
		return this.apiService.get<LogChartData>(
			`${this.endpoint}/chartdata`,
			params
		);
	}

	/**
	 * Gets log statistics for the specified date range
	 * @param startDate - Optional start date filter
	 * @param endDate - Optional end date filter
	 * @returns Observable of LogStatistics
	 */
	getStatistics(
		startDate?: string,
		endDate?: string
	): Observable<LogStatistics>
	{
		let params: HttpParams = new HttpParams();

		if (startDate)
		{
			params = params.set("startDate", startDate);
		}

		if (endDate)
		{
			params = params.set("endDate", endDate);
		}

		return this.apiService.get<LogStatistics>(
			`${this.endpoint}/statistics`,
			params
		);
	}
}
