/**
 * Base query request interface for paginated queries
 * Matches server BaseQueryRequest property names
 */
export interface BaseQueryRequest
{
	/** Page number (1-based) - matches server 'Page' */
	page?: number;

	/** Number of items per page */
	pageSize?: number;

	/** Search term for filtering */
	searchTerm?: string | null;

	/** Start date for date range filtering */
	startDate?: Date | null;

	/** End date for date range filtering */
	endDate?: Date | null;

	/** Field to sort by */
	sortBy?: string | null;

	/** Sort in descending order */
	sortDescending?: boolean;
}
