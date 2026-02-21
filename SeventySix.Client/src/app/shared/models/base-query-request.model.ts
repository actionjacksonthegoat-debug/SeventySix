/**
 * Base query request interface for paginated queries.
 * Matches server BaseQueryRequest property names.
 */
export interface BaseQueryRequest
{
	/**
	 * Page number (1-based) used for pagination.
	 * @type {number | undefined}
	 */
	page?: number;

	/**
	 * Number of items per page.
	 * @type {number | undefined}
	 */
	pageSize?: number;

	/**
	 * Search term used for filtering results.
	 * @type {string | null | undefined}
	 */
	searchTerm?: string | null;

	/**
	 * Start date for date range filtering.
	 * @type {Date | null | undefined}
	 */
	startDate?: Date | null;

	/**
	 * End date for date range filtering.
	 * @type {Date | null | undefined}
	 */
	endDate?: Date | null;

	/**
	 * Field name used to sort results.
	 * @type {string | null | undefined}
	 */
	sortBy?: string | null;

	/**
	 * True when sorting should be in descending order.
	 * @type {boolean | undefined}
	 */
	sortDescending?: boolean;
}