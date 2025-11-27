/**
 * Generic Mock Data Builder
 * Provides utilities for creating common test data structures
 */

import { PagedResult } from "@features/admin/users/models/user.model";

/**
 * Create a paged result for testing
 */
export function createPagedResult<T>(
	items: T[],
	totalCount: number = items.length,
	pageNumber: number = 1,
	pageSize: number = 25
): PagedResult<T>
{
	const totalPages: number = Math.ceil(totalCount / pageSize);

	return {
		items,
		totalCount,
		pageNumber,
		pageSize,
		totalPages,
		hasPreviousPage: pageNumber > 1,
		hasNextPage: pageNumber < totalPages
	};
}

/**
 * Create an empty paged result
 */
export function createEmptyPagedResult<T>(): PagedResult<T>
{
	return {
		items: [],
		totalCount: 0,
		pageNumber: 1,
		pageSize: 25,
		totalPages: 0,
		hasPreviousPage: false,
		hasNextPage: false
	};
}

/**
 * Create a date range for testing
 */
export function createDateRange(daysAgo: number = 30): {
	startDate: string;
	endDate: string;
}
{
	const endDate: Date = new Date();
	const startDate: Date = new Date();
	startDate.setDate(startDate.getDate() - daysAgo);

	return {
		startDate: startDate.toISOString(),
		endDate: endDate.toISOString()
	};
}

/**
 * Create a mock error response
 */
export function createMockError(
	message: string = "Test error",
	status: number = 500
): { message: string; status: number }
{
	return { message, status };
}
