import {
	AvailableRoleDto,
	CreatePermissionRequestDto,
	PermissionRequestDto
} from "@admin/permission-requests/models";
import {
	inject,
	Injectable
} from "@angular/core";
import { BaseMutationService } from "@shared/services";
import { ApiService } from "@shared/services/api.service";
import { CacheCoordinationService } from "@shared/services/cache-coordination.service";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	CreateMutationResult,
	CreateQueryResult,
	injectQuery
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";

/**
 * Service for permission request business logic.
 * Uses TanStack Query for caching and state management.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestService extends BaseMutationService
{
	/**
	 * Query key prefix used by TanStack Query to namespace permission request queries.
	 * @type {string}
	 */
	protected readonly queryKeyPrefix: string = "permissionRequests";

	/**
	 * API service used to communicate with backend endpoints for permission requests.
	 * @type {ApiService}
	 * @private
	 * @readonly
	 */
	private readonly apiService: ApiService =
		inject(ApiService);

	/**
	 * Endpoint base path for permission request API routes.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly endpoint: string = "users";

	/**
	 * Service for coordinating cache invalidation across domain boundaries.
	 * Used to invalidate account caches when permission requests are approved or rejected.
	 * @type {CacheCoordinationService}
	 * @private
	 * @readonly
	 */
	private readonly cacheCoordination: CacheCoordinationService =
		inject(CacheCoordinationService);

	/** Query for all permission requests (admin). */
	getAllRequests(): CreateQueryResult<PermissionRequestDto[]>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.permissionRequests.list,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<PermissionRequestDto[]>(`${this.endpoint}/permission-requests`)),
				...this.queryConfig
			}));
	}

	/** Query for available roles (current user). */
	getAvailableRoles(): CreateQueryResult<AvailableRoleDto[]>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.permissionRequests.availableRoles,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<AvailableRoleDto[]>(`${this.endpoint}/me/available-roles`)),
				...this.queryConfig
			}));
	}

	/** Mutation for creating permission requests. */
	createRequest(): CreateMutationResult<void, Error, CreatePermissionRequestDto>
	{
		return this.createMutation<CreatePermissionRequestDto, void>(
			(request) =>
				this.apiService.post<void, CreatePermissionRequestDto>(
					`${this.endpoint}/me/permission-requests`,
					request));
	}

	/** Mutation for approving a single request. */
	approveRequest(): CreateMutationResult<void, Error, number>
	{
		return this.createMutation<number, void>(
			(requestId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/permission-requests/${requestId}/approve`,
					{}),
			() =>
			{
				// Cross-domain: invalidate permission caches
				this.cacheCoordination.invalidatePermissionCaches();
			});
	}

	/** Mutation for rejecting a single request. */
	rejectRequest(): CreateMutationResult<void, Error, number>
	{
		return this.createMutation<number, void>(
			(requestId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/permission-requests/${requestId}/reject`,
					{}),
			() =>
			{
				// Cross-domain: invalidate permission caches
				this.cacheCoordination.invalidatePermissionCaches();
			});
	}

	/** Mutation for bulk approving requests. */
	bulkApproveRequests(): CreateMutationResult<number, Error, number[]>
	{
		return this.createMutation<number[], number>(
			(requestIds) =>
				this.apiService.post<number, number[]>(
					`${this.endpoint}/permission-requests/bulk/approve`,
					requestIds),
			() =>
			{
				// Cross-domain: invalidate permission caches
				this.cacheCoordination.invalidatePermissionCaches();
			});
	}

	/** Mutation for bulk rejecting requests. */
	bulkRejectRequests(): CreateMutationResult<number, Error, number[]>
	{
		return this.createMutation<number[], number>(
			(requestIds) =>
				this.apiService.post<number, number[]>(
					`${this.endpoint}/permission-requests/bulk/reject`,
					requestIds),
			() =>
			{
				// Cross-domain: invalidate permission caches
				this.cacheCoordination.invalidatePermissionCaches();
			});
	}
}
