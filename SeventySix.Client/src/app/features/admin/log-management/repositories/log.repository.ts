/**
 * Log Repository
 * Handles data access for log entities
 * Implements Repository Pattern (SOLID - SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import {
	LogResponse,
	LogFilterRequest,
	LogCountResponse,
	PagedLogResponse
} from "@admin/log-management/models";

/**
 * Repository for log data access
 * Follows the Repository pattern to abstract API calls
 * Provides CRUD operations for log entities
 */
@Injectable({
	providedIn: "root"
})
export class LogRepository
{
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/logs`;

	/**
	 * Get paginated logs with optional filtering
	 * @param filter - Filter criteria
	 * @returns Observable of paged log response
	 */
	getAll(filter?: LogFilterRequest): Observable<PagedLogResponse>
	{
		let params = new HttpParams();

		if (filter)
		{
			if (filter.logLevel !== undefined && filter.logLevel !== null)
			{
				params = params.set("logLevel", filter.logLevel.toString());
			}
			if (filter.startDate)
			{
				params = params.set(
					"startDate",
					filter.startDate.toISOString()
				);
			}
			if (filter.endDate)
			{
				params = params.set("endDate", filter.endDate.toISOString());
			}
			if (filter.sourceContext)
			{
				params = params.set("sourceContext", filter.sourceContext);
			}
			if (filter.requestPath)
			{
				params = params.set("requestPath", filter.requestPath);
			}
			if (filter.pageNumber !== undefined)
			{
				params = params.set("pageNumber", filter.pageNumber.toString());
			}
			if (filter.pageSize !== undefined)
			{
				params = params.set("pageSize", filter.pageSize.toString());
			}
			if (filter.searchTerm)
			{
				params = params.set("searchTerm", filter.searchTerm);
			}
		}

		return this.http.get<PagedLogResponse>(this.apiUrl, { params });
	}

	/**
	 * Get a single log by ID
	 * @param id - Log ID
	 * @returns Observable of log response
	 */
	getById(id: number): Observable<LogResponse>
	{
		return this.http.get<LogResponse>(`${this.apiUrl}/${id}`);
	}

	/**
	 * Get total count of logs matching filter criteria
	 * @param filter - Filter criteria
	 * @returns Observable of log count response
	 */
	getCount(filter?: LogFilterRequest): Observable<LogCountResponse>
	{
		let params = new HttpParams();

		if (filter)
		{
			if (filter.logLevel !== undefined && filter.logLevel !== null)
			{
				params = params.set("logLevel", filter.logLevel.toString());
			}
			if (filter.startDate)
			{
				params = params.set(
					"startDate",
					filter.startDate.toISOString()
				);
			}
			if (filter.endDate)
			{
				params = params.set("endDate", filter.endDate.toISOString());
			}
			if (filter.sourceContext)
			{
				params = params.set("sourceContext", filter.sourceContext);
			}
			if (filter.requestPath)
			{
				params = params.set("requestPath", filter.requestPath);
			}
		}

		return this.http.get<LogCountResponse>(`${this.apiUrl}/count`, {
			params
		});
	}

	/**
	 * Delete a single log by ID
	 * @param id - Log ID
	 * @returns Observable of void (204 No Content on success)
	 */
	delete(id: number): Observable<void>
	{
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}

	/**
	 * Delete multiple logs by IDs
	 * @param ids - Array of log IDs to delete
	 * @returns Observable with count of deleted logs
	 */
	deleteBatch(ids: number[]): Observable<number>
	{
		return this.http.request<number>("DELETE", `${this.apiUrl}/batch`, {
			body: ids
		});
	}
}
