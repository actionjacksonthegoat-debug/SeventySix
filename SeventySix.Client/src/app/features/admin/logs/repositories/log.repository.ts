/**
 * Log Repository
 * Handles data access for log entities
 * Implements Repository Pattern (SOLID - SRP, DIP)
 */

import { Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { HttpRepository } from "@infrastructure/repositories/http.repository";
import {
	LogResponse,
	LogFilterRequest,
	LogCountResponse,
	PagedLogResponse
} from "@admin/logs/models";

/**
 * Repository for log data access
 * Extends HttpRepository for standard CRUD operations
 * Provided at route level for proper garbage collection (see admin.routes.ts)
 */
@Injectable()
export class LogRepository extends HttpRepository<LogResponse>
{
	protected readonly endpoint: string = "logs";

	/**
	 * Get paginated logs with optional filtering
	 * @param filter - Filter criteria
	 * @returns Observable of paged log response
	 */
	getAllPaged(filter?: LogFilterRequest): Observable<PagedLogResponse>
	{
		const params: HttpParams | undefined = filter
			? this.buildParams({
					logLevel: filter.logLevel,
					startDate: filter.startDate,
					endDate: filter.endDate,
					page: filter.pageNumber, // Map pageNumber to page for backend
					pageSize: filter.pageSize,
					searchTerm: filter.searchTerm
				})
			: undefined;

		return this.apiService.get<PagedLogResponse>(this.endpoint, params);
	}

	/**
	 * Get a single log by ID
	 * @param id - Log ID
	 * @returns Observable of log response
	 */
	override getById(id: number): Observable<LogResponse>
	{
		return this.apiService.get<LogResponse>(`${this.endpoint}/${id}`);
	}

	/**
	 * Get total count of logs matching filter criteria
	 * @param filter - Filter criteria
	 * @returns Observable of log count response
	 */
	getCount(filter?: LogFilterRequest): Observable<LogCountResponse>
	{
		const params: HttpParams | undefined = filter
			? this.buildParams({
					logLevel: filter.logLevel,
					startDate: filter.startDate,
					endDate: filter.endDate,
					searchTerm: filter.searchTerm
				})
			: undefined;

		return this.apiService.get<LogCountResponse>(
			`${this.endpoint}/count`,
			params
		);
	}

	/**
	 * Delete a single log by ID
	 * @param id - Log ID
	 * @returns Observable of void (204 No Content on success)
	 */
	override delete(id: number): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	/**
	 * Delete multiple logs by IDs
	 * @param ids - Array of log IDs to delete
	 * @returns Observable with count of deleted logs
	 */
	deleteBatch(ids: number[]): Observable<number>
	{
		return this.apiService.delete<number>(`${this.endpoint}/batch`, ids);
	}
}
