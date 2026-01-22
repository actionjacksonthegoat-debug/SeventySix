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
} from "@shared/constants";
import { LoggerService } from "@shared/services/logger.service";
import { catchError, Observable, throwError, timeout } from "rxjs";

/**
 * Low-level HTTP wrapper for API communication.
 * Provides consistent headers, error handling, and logging.
 *
 * NOTE: Request deduplication and caching are handled by TanStack Query
 * at the service layer. This service should remain a thin HTTP wrapper.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class ApiService
{
	/**
	 * Base API URL used to build request endpoints.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly baseUrl: string =
		environment.apiUrl;

	/**
	 * HTTP client for performing API requests.
	 * @type {HttpClient}
	 * @private
	 * @readonly
	 */
	private readonly http: HttpClient =
		inject(HttpClient);

	/**
	 * Logger service for diagnostic messages related to API calls.
	 * @type {LoggerService}
	 * @private
	 * @readonly
	 */
	private readonly logger: LoggerService =
		inject(LoggerService);

	/**
	 * Default request timeout in milliseconds from environment config.
	 * @type {number}
	 * @private
	 * @readonly
	 */
	private readonly defaultTimeout: number =
		environment.http.defaultTimeout;

	/**
	 * Default HTTP headers applied to all requests from this service.
	 * @type {HttpHeaders}
	 * @private
	 */
	private defaultHeaders: HttpHeaders =
		new HttpHeaders(
			{
				[HTTP_HEADER_CONTENT_TYPE]: MEDIA_TYPE_JSON
			});

	/**
	 * Sends an HTTP GET request to the API.
	 * @param {string} endpoint
	 * The endpoint path relative to the API base URL (no leading '/').
	 * @param {HttpParams} params
	 * Optional query parameters for the request.
	 * @param {HttpContext} context
	 * Optional HTTP context for request-scoped metadata.
	 * @returns {Observable<T>}
	 * Observable that resolves to the typed response body or errors on timeout.
	 */
	get<T>(
		endpoint: string,
		params?: HttpParams,
		context?: HttpContext): Observable<T>
	{
		return this
			.http
			.get<T>(`${this.baseUrl}/${endpoint}`,
				{
					headers: this.defaultHeaders,
					params,
					context
				})
			.pipe(
				timeout(this.defaultTimeout),
				catchError(this.handleError));
	}

	/**
	 * Sends an HTTP POST request to the API.
	 * @param {string} endpoint
	 * The endpoint path relative to the API base URL (no leading '/').
	 * @param {U} body
	 * The request payload to send to the server.
	 * @returns {Observable<T>}
	 * Observable that resolves to the typed response body or errors on timeout.
	 */
	post<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this
			.http
			.post<T>(`${this.baseUrl}/${endpoint}`, body,
				{
					headers: this.defaultHeaders
				})
			.pipe(
				timeout(this.defaultTimeout),
				catchError(this.handleError));
	}

	/**
	 * Sends an HTTP PUT request to the API.
	 * @param {string} endpoint
	 * The endpoint path relative to the API base URL (no leading '/').
	 * @param {U} body
	 * The request payload to send to the server.
	 * @returns {Observable<T>}
	 * Observable that resolves to the typed response body or errors on timeout.
	 */
	put<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this
			.http
			.put<T>(`${this.baseUrl}/${endpoint}`, body,
				{
					headers: this.defaultHeaders
				})
			.pipe(
				timeout(this.defaultTimeout),
				catchError(this.handleError));
	}

	/**
	 * Sends an HTTP PATCH request to the API.
	 * @param {string} endpoint
	 * The endpoint path relative to the API base URL (no leading '/').
	 * @param {U} body
	 * The request payload to send to the server.
	 * @returns {Observable<T>}
	 * Observable that resolves to the typed response body or errors on timeout.
	 */
	patch<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this
			.http
			.patch<T>(`${this.baseUrl}/${endpoint}`, body,
				{
					headers: this.defaultHeaders
				})
			.pipe(
				timeout(this.defaultTimeout),
				catchError(this.handleError));
	}

	/**
	 * Sends an HTTP DELETE request to the API with an optional body.
	 * @param {string} endpoint
	 * The endpoint path relative to the API base URL (no leading '/').
	 * @param {U} body
	 * Optional request body for delete operations.
	 * @returns {Observable<T>}
	 * Observable that resolves to the typed response body or errors on timeout.
	 */
	delete<T, U = unknown>(endpoint: string, body?: U): Observable<T>
	{
		return this
			.http
			.request<T>("DELETE", `${this.baseUrl}/${endpoint}`,
				{
					headers: this.defaultHeaders,
					body
				})
			.pipe(
				timeout(this.defaultTimeout),
				catchError(this.handleError));
	}

	/**
	 * Adds or updates default headers used for subsequent requests.
	 * @param {Record<string, string>} headers
	 * A dictionary of header keys and values to merge into default headers.
	 * @returns {void}
	 */
	addHeaders(headers: Record<string, string>): void
	{
		Object
			.entries(headers)
			.forEach(
				([key, value]) =>
				{
					this.defaultHeaders =
						this.defaultHeaders.set(key, value);
				});
	}

	/**
	 * Centralized HTTP error handler used with RxJS catchError.
	 * @param {HttpErrorResponse} error
	 * The HTTP error response thrown by HttpClient.
	 * @returns {Observable<never>}
	 * Observable that errors with a normalized Error instance.
	 */
	private handleError: (error: HttpErrorResponse) => Observable<never> =
		(
			error: HttpErrorResponse): Observable<never> =>
		{
			const errorMessage: string =
				error.error instanceof ErrorEvent
					? `Client-side error: ${error.error.message}`
					: `Server-side error: ${error.status} ${error.message}`;

			this.logger.error(errorMessage, error);

			return throwError(
				() => new Error(errorMessage));
		};
}
