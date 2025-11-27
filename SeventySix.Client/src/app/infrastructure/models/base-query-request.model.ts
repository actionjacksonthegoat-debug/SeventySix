/**
 * Base query request interface for paginated queries
 * Provides common properties shared across all query requests
 */
export interface BaseQueryRequest
{
	/**
	 * Page number (1-based)
	 */
	pageNumber?: number;

	/**
	 * Number of items per page
	 */
	pageSize?: number;

	/**
	 * Search term for filtering
	 */
	searchTerm?: string | null;

	/**
	 * Start date for date range filtering
	 */
	startDate?: Date | null;

	/**
	 * End date for date range filtering
	 */
	endDate?: Date | null;

	/**
	 * Field to sort by
	 */
	sortBy?: string | null;

	/**
	 * Sort in descending order
	 */
	sortDescending?: boolean;
}
