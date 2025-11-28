import { inject, Injectable } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { buildHttpParams } from "@infrastructure/utils/http-params.utility";
import {
	LogResponse,
	LogFilterRequest,
	LogCountResponse,
	PagedLogResponse
} from "@admin/logs/models";

@Injectable()
export class LogRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "logs";

	getAllPaged(filter?: LogFilterRequest): Observable<PagedLogResponse>
	{
		const params: HttpParams | undefined = filter
			? buildHttpParams({
					logLevel: filter.logLevel,
					startDate: filter.startDate,
					endDate: filter.endDate,
					page: filter.pageNumber,
					pageSize: filter.pageSize,
					searchTerm: filter.searchTerm
				})
			: undefined;

		return this.apiService.get<PagedLogResponse>(this.endpoint, params);
	}

	getById(id: number): Observable<LogResponse>
	{
		return this.apiService.get<LogResponse>(`${this.endpoint}/${id}`);
	}

	getCount(filter?: LogFilterRequest): Observable<LogCountResponse>
	{
		const params: HttpParams | undefined = filter
			? buildHttpParams({
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

	delete(id: number): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	deleteBatch(ids: number[]): Observable<number>
	{
		return this.apiService.delete<number>(`${this.endpoint}/batch`, ids);
	}
}
