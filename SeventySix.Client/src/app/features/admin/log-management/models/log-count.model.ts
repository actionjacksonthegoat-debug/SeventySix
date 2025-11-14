/**
 * Log count response model matching backend LogCountResponse DTO
 */
export interface LogCountResponse
{
	total: number;
}

/**
 * Log delete response for batch operations
 */
export interface LogDeleteResponse
{
	deletedCount: number;
}
