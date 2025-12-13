import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	UpdateProfileRequest,
	CreatePermissionRequestDto,
	UserProfileDto,
	AvailableRoleDto
} from "../models";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { QueryKeys } from "@infrastructure/utils/query-keys";
import { createMutation } from "@infrastructure/utils/mutation-factory";

/** Service for current user's account operations. Provided at route level. */
@Injectable()
export class AccountService
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("account");
	private readonly endpoint: string = "users/me";

	getProfile()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.account.profile,
			queryFn: () => lastValueFrom(this.apiService.get<UserProfileDto>("auth/me")),
			...this.queryConfig
		}));
	}

	updateProfile()
	{
		return createMutation<UpdateProfileRequest, UserProfileDto>(
			(request) =>
				this.apiService.put<UserProfileDto>(this.endpoint, request),
			this.queryClient,
			"account");
	}

	getAvailableRoles()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.account.availableRoles,
			queryFn: () =>
				lastValueFrom(this.apiService.get<AvailableRoleDto[]>(`${this.endpoint}/available-roles`)),
			...this.queryConfig
		}));
	}

	createPermissionRequest()
	{
		return createMutation<CreatePermissionRequestDto, void>(
			(request) =>
				this.apiService.post<void, CreatePermissionRequestDto>(
					`${this.endpoint}/permission-requests`,
					request),
			this.queryClient,
			"account",
			() =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.account.availableRoles
				});
			});
	}
}
