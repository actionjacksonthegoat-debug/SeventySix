import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	injectMutation,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { PermissionRequestRepository } from "../repositories";
import { CreatePermissionRequest } from "../models";
import { getQueryConfig } from "@infrastructure/utils/query-config";

/**
 * Service for permission request business logic.
 * Uses TanStack Query for caching and state management.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestService
{
	private readonly repository: PermissionRequestRepository =
		inject(PermissionRequestRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("permission-requests");

	/** Query for all permission requests (admin). */
	getAllRequests()
	{
		return injectQuery(() => ({
			queryKey: ["permission-requests", "all"],
			queryFn: () => lastValueFrom(this.repository.getAll()),
			...this.queryConfig
		}));
	}

	/** Query for available roles (current user). */
	getAvailableRoles()
	{
		return injectQuery(() => ({
			queryKey: ["permission-requests", "available-roles"],
			queryFn: () => lastValueFrom(this.repository.getAvailableRoles()),
			...this.queryConfig
		}));
	}

	/** Mutation for creating permission requests. */
	createRequest()
	{
		return injectMutation(() => ({
			mutationFn: (request: CreatePermissionRequest) =>
				lastValueFrom(this.repository.create(request)),
			onSuccess: () =>
			{
				this.queryClient.invalidateQueries({
					queryKey: ["permission-requests"]
				});
			}
		}));
	}
}
