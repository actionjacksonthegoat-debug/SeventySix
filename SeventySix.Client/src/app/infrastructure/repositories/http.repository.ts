/**
 * Base HTTP Repository
 * Abstract base class for repositories that use ApiService
 * Implements DRY principle by centralizing common HTTP operations
 * Follows Repository Pattern (SOLID - SRP, OCP, DIP)
 */

import { inject } from "@angular/core";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { ApiService } from "@infrastructure/api-services/api.service";

/**
 * Abstract base class for HTTP-based repositories
 * Provides standard CRUD operations via ApiService (DRY)
 * @template T The entity type
 */
export abstract class HttpRepository<T>
{
	protected readonly apiService: ApiService = inject(ApiService);
	protected abstract readonly endpoint: string;

	/**
	 * Get all entities
	 * @returns Observable array of entities
	 */
	getAll(): Observable<T[]>
	{
		return this.apiService.get<T[]>(this.endpoint);
	}

	/**
	 * Get entity by ID
	 * @param id The entity identifier
	 * @returns Observable of entity
	 */
	getById(id: number | string): Observable<T>
	{
		return this.apiService.get<T>(`${this.endpoint}/${id}`);
	}

	/**
	 * Create new entity
	 * @param entity The entity data to create
	 * @returns Observable of created entity
	 */
	create(entity: Partial<T>): Observable<T>
	{
		return this.apiService.post<T>(this.endpoint, entity);
	}

	/**
	 * Update existing entity
	 * @param id The entity identifier
	 * @param entity The entity data to update
	 * @returns Observable of updated entity
	 */
	update(id: number | string, entity: Partial<T>): Observable<T>
	{
		return this.apiService.put<T>(`${this.endpoint}/${id}`, entity);
	}

	/**
	 * Delete entity
	 * @param id The entity identifier
	 * @returns Observable of void
	 */
	delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}

	/**
	 * Build HttpParams from key-value object
	 * Helper method to avoid HttpParams construction duplication
	 * @param params Object with parameter key-value pairs
	 * @returns HttpParams instance
	 */
	protected buildParams(params: Record<string, unknown>): HttpParams
	{
		let httpParams: HttpParams = new HttpParams();

		for (const [key, value] of Object.entries(params))
		{
			if (value !== undefined && value !== null)
			{
				if (value instanceof Date)
				{
					httpParams = httpParams.set(key, value.toISOString());
				}
				else
				{
					httpParams = httpParams.set(key, String(value));
				}
			}
		}

		return httpParams;
	}
}
