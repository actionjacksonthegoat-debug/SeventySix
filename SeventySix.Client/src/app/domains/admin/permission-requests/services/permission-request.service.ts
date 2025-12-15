import {
	inject,
	Injectable
} from "@angular/core";
import { BaseMutationService } from "@shared/services";
import { ApiService } from "@shared/services/api.service";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import {
	AvailableRoleDto,
	CreatePermissionRequestDto,
	PermissionRequestDto
} from "@admin/permission-requests/models";

/**
 * Service for permission request business logic.
 * Uses TanStack Query for caching and state management.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestService extends BaseMutationService
{
	protected readonly queryKeyPrefix: string = "permissionRequests";
	private readonly apiService: ApiService =
		inject(ApiService);
	private readonly endpoint: string = "users";

	/** Query for all permission requests (admin). */
	getAllRequests()
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
	getAvailableRoles()
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
	createRequest()
	{
		return this.createMutation<CreatePermissionRequestDto, void>(
			(request) =>
				this.apiService.post<void, CreatePermissionRequestDto>(
					`${this.endpoint}/me/permission-requests`,
					request));
	}

	/** Mutation for approving a single request. */
	approveRequest()
	{
		return this.createMutation<number, void>(
			(requestId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/permission-requests/${requestId}/approve`,
					{}));
	}

	/** Mutation for rejecting a single request. */
	rejectRequest()
	{
		return this.createMutation<number, void>(
			(requestId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/permission-requests/${requestId}/reject`,
					{}));
	}

	/** Mutation for bulk approving requests. */
	bulkApproveRequests()
	{
		return this.createMutation<number[], number>(
			(requestIds) =>
				this.apiService.post<number, number[]>(
					`${this.endpoint}/permission-requests/bulk/approve`,
					requestIds));
	}

	/** Mutation for bulk rejecting requests. */
	bulkRejectRequests()
	{
		return this.createMutation<number[], number>(
			(requestIds) =>
				this.apiService.post<number, number[]>(
					`${this.endpoint}/permission-requests/bulk/reject`,
					requestIds));
	}
}
