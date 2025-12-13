import {
	inject,
	Injectable
} from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { BaseMutationService } from "@infrastructure/services";
import {
	UpdateProfileRequest,
	CreatePermissionRequestDto,
	UserProfileDto,
	AvailableRoleDto
} from "../models";
import { QueryKeys } from "@infrastructure/utils/query-keys";

/** Service for current user's account operations. Provided at route level. */
@Injectable()
export class AccountService extends BaseMutationService
{
	protected readonly queryKeyPrefix: string = "account";
	private readonly apiService: ApiService = inject(ApiService);
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
		return this.createMutation<UpdateProfileRequest, UserProfileDto>(
			(request) =>
				this.apiService.put<UserProfileDto>(this.endpoint, request)
		);
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
		return this.createMutation<CreatePermissionRequestDto, void>(
			(request) =>
				this.apiService.post<void, CreatePermissionRequestDto>(
					`${this.endpoint}/permission-requests`,
					request
				),
			() =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.account.availableRoles
				});
			}
		);
	}
}
