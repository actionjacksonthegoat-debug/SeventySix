import {
	HttpClient,
	HttpContext,
	HttpErrorResponse,
	HttpHeaders,
	HttpParams
} from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import {
	HTTP_HEADER_CONTENT_TYPE,
	MEDIA_TYPE_JSON
} from "@infrastructure/constants";
import { LoggerService } from "@infrastructure/services/logger.service";
import { catchError, Observable, throwError } from "rxjs";

/**
 * Low-level HTTP wrapper for API communication.
 * Provides consistent headers, error handling, and logging.
 *
 * NOTE: Request deduplication and caching are handled by TanStack Query
 * at the service layer. This service should remain a thin HTTP wrapper.
 */
@Injectable({
	providedIn: "root"
})
export class ApiService
{
	private readonly baseUrl: string =
		environment.apiUrl;
	private readonly http: HttpClient =
		inject(HttpClient);
	private readonly logger: LoggerService =
		inject(LoggerService);
	private defaultHeaders: HttpHeaders =
		new HttpHeaders({
		[HTTP_HEADER_CONTENT_TYPE]: MEDIA_TYPE_JSON
	});

	get<T>(
		endpoint: string,
		params?: HttpParams,
		context?: HttpContext): Observable<T>
	{
		return this
			.http
			.get<T>(`${this.baseUrl}/${endpoint}`, {
				headers: this.defaultHeaders,
				params,
				context
			})
			.pipe(catchError(this.handleError));
	}

	post<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this
			.http
			.post<T>(`${this.baseUrl}/${endpoint}`, body, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	put<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this
			.http
			.put<T>(`${this.baseUrl}/${endpoint}`, body, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	patch<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this
			.http
			.patch<T>(`${this.baseUrl}/${endpoint}`, body, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	delete<T, U = unknown>(endpoint: string, body?: U): Observable<T>
	{
		return this
			.http
			.request<T>("DELETE", `${this.baseUrl}/${endpoint}`, {
				headers: this.defaultHeaders,
				body
			})
			.pipe(catchError(this.handleError));
	}

	addHeaders(headers: Record<string, string>): void
	{
		Object
			.entries(headers)
			.forEach(([key, value]) =>
			{
				this.defaultHeaders =
					this.defaultHeaders.set(key, value);
			});
	}

	private handleError: (error: HttpErrorResponse) => Observable<never> =
		(
		error: HttpErrorResponse): Observable<never> =>
	{
		const errorMessage: string =
			error.error instanceof ErrorEvent
				? `Client-side error: ${error.error.message}`
				: `Server-side error: ${error.status} ${error.message}`;

		this.logger.error(errorMessage, error);

		return throwError(() => new Error(errorMessage));
	};
}
