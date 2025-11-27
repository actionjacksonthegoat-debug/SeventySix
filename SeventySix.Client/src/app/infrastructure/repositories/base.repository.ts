/**
 * Base Repository Interface
 * Generic repository pattern for data access abstraction
 * Follows Dependency Inversion Principle (SOLID)
 */

import { Observable } from "rxjs";

/**
 * Generic repository interface for CRUD operations
 * @template T The entity type
 */
export interface IRepository<T>
{
	/**
	 * Get all entities
	 */
	getAll(): Observable<T[]>;

	/**
	 * Get entity by ID
	 * @param id The entity identifier
	 */
	getById(id: number | string): Observable<T>;

	/**
	 * Create new entity
	 * @param entity The entity to create
	 */
	create(entity: Partial<T>): Observable<T>;

	/**
	 * Update existing entity
	 * @param id The entity identifier
	 * @param entity The entity data to update
	 */
	update(id: number | string, entity: Partial<T>): Observable<T>;

	/**
	 * Delete entity
	 * @param id The entity identifier
	 */
	delete(id: number | string): Observable<void>;
}
