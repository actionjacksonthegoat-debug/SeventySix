import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	CreatePermissionRequestDto,
	PermissionRequestDto,
	AvailableRoleDto
} from "../models";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import { createMutation } from "@infrastructure/utils/mutation-factory";

/**
 * Service for permission request business logic.
 * Uses TanStack Query for caching and state management.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestService
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("permission-requests");
	private readonly endpoint: string = "users";

	/** Query for all permission requests (admin). */
	getAllRequests()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.permissionRequests.list,
			queryFn: () =>
				lastValueFrom(
					this.apiService.get<PermissionRequestDto[]>(`${this.endpoint}/permission-requests`)
				),
			...this.queryConfig
		}));
	}

	/** Query for available roles (current user). */
	getAvailableRoles()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.permissionRequests.availableRoles,
			queryFn: () =>
				lastValueFrom(
					this.apiService.get<AvailableRoleDto[]>(`${this.endpoint}/me/available-roles`)
				),
			...this.queryConfig
		}));
	}

	/** Mutation for creating permission requests. */
	createRequest()
	{
		return createMutation<CreatePermissionRequestDto, void>(
			(request) =>
				this.apiService.post<void, CreatePermissionRequestDto>(
					`${this.endpoint}/me/permission-requests`,
					request),
			this.queryClient,
			"permissionRequests");
	}

	/** Mutation for approving a single request. */
	approveRequest()
	{
		return createMutation<number, void>(
			(requestId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/permission-requests/${requestId}/approve`,
					{}),
			this.queryClient,
			"permissionRequests");
	}

	/** Mutation for rejecting a single request. */
	rejectRequest()
	{
		return createMutation<number, void>(
			(requestId) =>
				this.apiService.post<void, Record<string, never>>(
					`${this.endpoint}/permission-requests/${requestId}/reject`,
					{}),
			this.queryClient,
			"permissionRequests");
	}

	/** Mutation for bulk approving requests. */
	bulkApproveRequests()
	{
		return createMutation<number[], number>(
			(requestIds) =>
				this.apiService.post<number, number[]>(
					`${this.endpoint}/permission-requests/bulk/approve`,
					requestIds),
			this.queryClient,
			"permissionRequests");
	}

	/** Mutation for bulk rejecting requests. */
	bulkRejectRequests()
	{
		return createMutation<number[], number>(
			(requestIds) =>
				this.apiService.post<number, number[]>(
					`${this.endpoint}/permission-requests/bulk/reject`,
					requestIds),
			this.queryClient,
			"permissionRequests");
	}
}
