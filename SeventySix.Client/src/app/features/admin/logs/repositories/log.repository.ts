import { inject, Injectable } from "@angular/core";
import { HttpContext, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { PagedResponse } from "@infrastructure/models";
import { buildHttpParams } from "@infrastructure/utils/http-params.utility";
import { LogDto, LogQueryRequest } from "@admin/logs/models";

@Injectable()
export class LogRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "logs";

	getAllPaged(
		filter?: LogQueryRequest,
		context?: HttpContext
	): Observable<PagedResponse<LogDto>>
	{
		const params: HttpParams | undefined = filter
			? buildHttpParams({
					logLevel: filter.logLevel,
					startDate: filter.startDate,
					endDate: filter.endDate,
					page: filter.page,
					pageSize: filter.pageSize,
					searchTerm: filter.searchTerm,
					sortBy: filter.sortBy,
					sortDescending: filter.sortDescending
				})
			: undefined;

		return this.apiService.get<PagedResponse<LogDto>>(
			this.endpoint,
			params,
			context
		);
	}

	getById(id: number): Observable<LogDto>
	{
		return this.apiService.get<LogDto>(`${this.endpoint}/${id}`);
	}

	delete(id: number): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	deleteBatch(ids: number[]): Observable<number>
	{
		return this.apiService.delete<number>(`${this.endpoint}/batch`, ids);
	}
}
