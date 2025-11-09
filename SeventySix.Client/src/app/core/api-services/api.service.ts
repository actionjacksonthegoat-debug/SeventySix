import {
	HttpClient,
	HttpErrorResponse,
	HttpHeaders,
	HttpParams
} from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { catchError, Observable, throwError } from "rxjs";
import { IApiService } from "./i-api.service";

/**
 * API Service
 * Implements IApiService interface for HTTP communication
 * Provides centralized API calls with error handling
 */
@Injectable({
	providedIn: "root"
})
export class ApiService implements IApiService
{
	private baseUrl: string = environment.apiUrl;
	private defaultHeaders: HttpHeaders = new HttpHeaders({
		"Content-Type": "application/json"
	});
	private http: HttpClient = inject(HttpClient);

	/**
	 * Handle HTTP errors
	 * @param error The HTTP error response
	 * @returns An observable error
	 */
	private handleError(error: HttpErrorResponse): Observable<never>
	{
		let errorMessage = "An error occurred";

		if (error.error instanceof ErrorEvent)
		{
			errorMessage = `Client-side error: ${error.error.message}`;
		}
		else
		{
			errorMessage = `Server-side error: ${error.status} ${error.message}`;
		}

		console.error(errorMessage);

		return throwError(() =>
		{
			return new Error(errorMessage);
		});
	}

	/**
	 * Generic GET request
	 * @param endpoint - The API endpoint to call
	 * @param params - Optional query parameters
	 * @returns Observable of type T
	 */
	get<T>(endpoint: string, params?: HttpParams): Observable<T>
	{
		return this.http
			.get<T>(`${this.baseUrl}/${endpoint}`, {
				headers: this.defaultHeaders,
				params
			})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Generic POST request
	 * @param endpoint - The API endpoint to call
	 * @param body - The data to send
	 * @returns Observable of type T
	 */
	post<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this.http
			.post<T>(`${this.baseUrl}/${endpoint}`, body, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Generic PUT request
	 * @param endpoint - The API endpoint to call
	 * @param body - The data to send
	 * @returns Observable of type T
	 */
	put<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this.http
			.put<T>(`${this.baseUrl}/${endpoint}`, body, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Generic PATCH request
	 * @param endpoint - The API endpoint to call
	 * @param body - The partial data to send
	 * @returns Observable of type T
	 */
	patch<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		return this.http
			.patch<T>(`${this.baseUrl}/${endpoint}`, body, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Generic DELETE request
	 * @param endpoint - The API endpoint to call
	 * @returns Observable of type T
	 */
	delete<T>(endpoint: string): Observable<T>
	{
		return this.http
			.delete<T>(`${this.baseUrl}/${endpoint}`, {
				headers: this.defaultHeaders
			})
			.pipe(catchError(this.handleError));
	}

	/**
	 * Add custom headers to the default headers
	 * @param headers - Additional headers to add
	 */
	addHeaders(headers: Record<string, string>): void
	{
		Object.entries(headers).forEach(([key, value]) =>
		{
			this.defaultHeaders = this.defaultHeaders.set(key, value);
		});
	}
}
