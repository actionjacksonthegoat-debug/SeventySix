/**
 * Mock ApiService for unit tests.
 * Provides an in-memory mapping of endpoint to mock responses used by unit and integration tests.
 * Use `setMockResponse` to register responses and the HTTP methods will return the registered value or a default/error.
 */

import { HttpParams } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";

export class MockApiService
{
	// Mock data storage
	private mockData: Map<string, unknown> =
		new Map<string, unknown>();

	/**
	 * Register a mock response for a specific endpoint.
	 * @param {string} endpoint
	 * The endpoint key to associate with the mock response.
	 * @param {T} data
	 * The mock response payload returned by the mock HTTP methods.
	 * @returns {void}
	 */
	setMockResponse<T>(endpoint: string, data: T): void
	{
		this.mockData.set(endpoint, data);
	}

	/**
	 * Mock GET request
	 * @param {string} endpoint
	 * The endpoint key to request.
	 * @param {HttpParams} _params
	 * Optional query parameters (ignored by the mock implementation).
	 * @returns {Observable<T>}
	 * Observable that resolves to the registered mock value or errors when missing.
	 */
	get<T>(endpoint: string, _params?: HttpParams): Observable<T>
	{
		const data: unknown | undefined =
			this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return throwError(
			() =>
				new Error(`No mock data for ${endpoint}`));
	}

	/**
	 * Mock POST request
	 *
	 * @param {string} endpoint
	 * The endpoint key to request.
	 * @param {U} body
	 * The request payload to send.
	 * @returns {Observable<T>}
	 * Observable that resolves to the registered mock value or echoes the provided body.
	 */
	post<T, U = unknown>(endpoint: string, body?: U): Observable<T>
	{
		const data: unknown | undefined =
			this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of(body as unknown as T);
	}

	/**
	 * Mock PUT request
	 *
	 * @param {string} endpoint
	 * The endpoint key to request.
	 * @param {U} body
	 * The request payload to send.
	 * @returns {Observable<T>}
	 * Observable that resolves to the registered mock value or echoes the provided body.
	 */
	put<T, U = unknown>(endpoint: string, body?: U): Observable<T>
	{
		const data: unknown | undefined =
			this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of(body as unknown as T);
	}

	/**
	 * Mock PATCH request
	 *
	 * @param {string} endpoint
	 * The endpoint key to request.
	 * @param {U} body
	 * The patch payload to send.
	 * @returns {Observable<T>}
	 * Observable that resolves to the registered mock value or echoes the provided body.
	 */
	patch<T, U = unknown>(endpoint: string, body?: U): Observable<T>
	{
		const data: unknown | undefined =
			this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of(body as unknown as T);
	}

	/**
	 * Mock DELETE request
	 *
	 * @param {string} endpoint
	 * The endpoint key to request.
	 * @returns {Observable<T>}
	 * Observable that resolves to the registered mock value or an empty object when not found.
	 */
	delete<T>(endpoint: string): Observable<T>
	{
		const data: unknown | undefined =
			this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of({} as T);
	}

	/**
	 * Mock addHeaders
	 *
	 * @param {Record<string, string>} _headers
	 * Headers to add (ignored by the mock implementation).
	 * @returns {void}
	 */
	addHeaders(_headers: Record<string, string>): void
	{
		// Mock implementation
	}

	/**
	 * Clear all mock data
	 *
	 * @returns {void}
	 * Clears the internal mock data map.
	 */
	clearMocks(): void
	{
		this.mockData.clear();
	}
}