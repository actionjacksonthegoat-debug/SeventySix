/**
 * API Service Interface
 * Abstraction for HTTP communication (Dependency Inversion Principle)
 */

import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

/**
 * Interface for API service operations
 * Allows for easy mocking and testing
 */
export interface IApiService
{
	/**
	 * HTTP GET request
	 * @param endpoint API endpoint
	 * @param params Optional query parameters
	 */
	get<T>(endpoint: string, params?: HttpParams): Observable<T>;

	/**
	 * HTTP POST request
	 * @param endpoint API endpoint
	 * @param body Request body
	 */
	post<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>;

	/**
	 * HTTP PUT request
	 * @param endpoint API endpoint
	 * @param body Request body
	 */
	put<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>;

	/**
	 * HTTP PATCH request
	 * @param endpoint API endpoint
	 * @param body Partial request body
	 */
	patch<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>;

	/**
	 * HTTP DELETE request
	 * @param endpoint API endpoint
	 */
	delete<T>(endpoint: string): Observable<T>;

	/**
	 * Add custom headers
	 * @param headers Headers to add
	 */
	addHeaders(headers: Record<string, string>): void;
}
