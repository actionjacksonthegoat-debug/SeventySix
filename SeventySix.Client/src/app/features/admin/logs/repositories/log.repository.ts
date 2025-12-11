import { inject, Injectable } from "@angular/core";
import { HttpContext, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { PagedResultOfLogDto } from "@infrastructure/api";
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
	): Observable<PagedResultOfLogDto>
	{
		const params: HttpParams | undefined = filter
			? buildHttpParams(filter)
			: undefined;

		return this.apiService.get<PagedResultOfLogDto>(
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
