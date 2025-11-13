import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { LogChartData, LogStatistics } from "../../../core/models/admin";

/**
 * Service for managing log chart data and statistics
 */
@Injectable({
	providedIn: "root"
})
export class LogChartService
{
	private readonly http = inject(HttpClient);
	private readonly apiUrl = "/api/logs";

	/**
	 * Gets log chart data for the specified period
	 * @param period - Time period (24h, 7d, 30d). Defaults to 24h
	 * @returns Observable of LogChartData
	 */
	getChartData(period: string = "24h"): Observable<LogChartData>
	{
		const params = new HttpParams().set("period", period);
		return this.http.get<LogChartData>(`${this.apiUrl}/chart-data`, {
			params
		});
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
		let params = new HttpParams();

		if (startDate)
		{
			params = params.set("startDate", startDate);
		}

		if (endDate)
		{
			params = params.set("endDate", endDate);
		}

		return this.http.get<LogStatistics>(`${this.apiUrl}/statistics`, {
			params
		});
	}
}
