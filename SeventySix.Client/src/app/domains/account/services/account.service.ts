import {
	AvailableRoleDto,
	CreatePermissionRequestDto,
	UpdateProfileRequest,
	UserProfileDto
} from "@account/models";
import {
	inject,
	Injectable
} from "@angular/core";
import { BaseMutationService } from "@shared/services";
import { ApiService } from "@shared/services/api.service";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	CreateMutationResult,
	injectQuery
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";

/** Service for current user's account operations. Provided at route level. */
@Injectable()
export class AccountService extends BaseMutationService
{
	protected readonly queryKeyPrefix: string = "account";
	private readonly apiService: ApiService =
		inject(ApiService);
	private readonly endpoint: string = "users/me";

	/**
	 * Query that loads the current user's profile.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with data, isLoading, and error.
	 */
	getProfile()
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.account.profile,
				queryFn: () =>
					lastValueFrom(this.apiService.get<UserProfileDto>("auth/me")),
				...this.queryConfig
			}));
	}

	/**
	 * Mutation used to update the current user's profile.
	 * @returns {CreateMutationResult<UserProfileDto, Error, UpdateProfileRequest>}
	 * Mutation with mutate, isPending and error.
	 */
	updateProfile(): CreateMutationResult<UserProfileDto, Error, UpdateProfileRequest>
	{
		return this.createMutation<UpdateProfileRequest, UserProfileDto>(
			(request) =>
				this.apiService.put<UserProfileDto>(this.endpoint, request));
	}

	/**
	 * Query that retrieves roles available to the current user.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with roles data and loading state.
	 */
	getAvailableRoles()
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.account.availableRoles,
				queryFn: () =>
					lastValueFrom(this.apiService.get<AvailableRoleDto[]>(`${this.endpoint}/available-roles`)),
				...this.queryConfig
			}));
	}

	/**
	 * Mutation to submit permission requests for the current user.
	 * Invalidates available roles on success.
	 * @returns {CreateMutationResult<void, Error, CreatePermissionRequestDto>}
	 * Mutation used to submit permission requests.
	 */
	createPermissionRequest(): CreateMutationResult<void, Error, CreatePermissionRequestDto>
	{
		return this.createMutation<CreatePermissionRequestDto, void>(
			(request) =>
				this.apiService.post<void, CreatePermissionRequestDto>(
					`${this.endpoint}/permission-requests`,
					request),
			() =>
			{
				this.queryClient.invalidateQueries(
					{
						queryKey: QueryKeys.account.availableRoles
					});
			});
	}
}
