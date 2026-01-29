import { BaseQueryClientService } from "@shared/services/base-query-client.service";

/**
 * Base class for query-only services without mutation or filter support.
 * Use when service only needs to read data without modifications.
 * For services needing mutations, use BaseMutationService.
 * For services needing mutations AND filters, use BaseQueryService.
 */
export abstract class BaseReadOnlyService extends BaseQueryClientService
{
	// Inherits from BaseQueryClientService:
	// - queryClient: QueryClient
	// - abstract queryKeyPrefix: string
	// - queryConfig getter
	// - invalidateAll()
	// - invalidateSingle(entityId)
}
