/**
 * Mock ApiService for testing
 */

import { Observable, of, throwError } from "rxjs";
import { HttpParams } from "@angular/common/http";

export class MockApiService
{
	// Mock data storage
	private mockData: Map<string, unknown> = new Map<string, unknown>();

	/**
	 * Set mock response for an endpoint
	 */
	setMockResponse<T>(endpoint: string, data: T): void
	{
		this.mockData.set(endpoint, data);
	}

	/**
	 * Mock GET request
	 */
	get<T>(endpoint: string, _params?: HttpParams): Observable<T>
	{
		const data: unknown | undefined = this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return throwError(() => new Error(`No mock data for ${endpoint}`));
	}

	/**
	 * Mock POST request
	 */
	post<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		const data: unknown | undefined = this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of(body as unknown as T);
	}

	/**
	 * Mock PUT request
	 */
	put<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		const data: unknown | undefined = this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of(body as unknown as T);
	}

	/**
	 * Mock PATCH request
	 */
	patch<T, U = Partial<T>>(endpoint: string, body: U): Observable<T>
	{
		const data: unknown | undefined = this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of(body as unknown as T);
	}

	/**
	 * Mock DELETE request
	 */
	delete<T>(endpoint: string): Observable<T>
	{
		const data: unknown | undefined = this.mockData.get(endpoint);
		if (data !== undefined)
		{
			return of(data as T);
		}
		return of({} as T);
	}

	/**
	 * Mock addHeaders
	 */
	addHeaders(_headers: Record<string, string>): void
	{
		// Mock implementation
	}

	/**
	 * Clear all mock data
	 */
	clearMocks(): void
	{
		this.mockData.clear();
	}
}
