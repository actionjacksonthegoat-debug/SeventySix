/**
 * Generic paged response matching server PagedResult<T>
 * Property names match server JSON serialization (camelCase)
 */
export interface PagedResponse<T>
{
	items: T[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
	hasPrevious: boolean;
	hasNext: boolean;
}
