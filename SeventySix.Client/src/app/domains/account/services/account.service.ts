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
import { ExternalLoginDto } from "@shared/services/auth.types";
import { CacheCoordinationService } from "@shared/services/cache-coordination.service";
import { QueryKeys } from "@shared/utilities/query-keys.utility";
import {
	CreateMutationResult,
	CreateQueryResult,
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
	 * Service for coordinating cache invalidation across domain boundaries.
	 * Used to invalidate admin users cache when account profile is updated.
	 * @type {CacheCoordinationService}
	 * @private
	 * @readonly
	 */
	private readonly cacheCoordination: CacheCoordinationService =
		inject(CacheCoordinationService);

	/**
	 * Query that loads the current user's profile.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with data, isLoading, and error.
	 */
	getProfile(): CreateQueryResult<UserProfileDto>
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
				this.apiService.put<UserProfileDto>(this.endpoint, request),
			() =>
			{
				// Cross-domain: invalidate users cache for admin panel
				this.cacheCoordination.invalidateAllUserCaches();
			});
	}

	/**
	 * Query that retrieves roles available to the current user.
	 * @returns {ReturnType<typeof injectQuery>}
	 * Query object with roles data and loading state.
	 */
	getAvailableRoles(): CreateQueryResult<AvailableRoleDto[]>
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

	/**
	 * Query that loads the current user's linked external OAuth logins.
	 * @returns {CreateQueryResult<ExternalLoginDto[]>}
	 * Query object with linked providers data and loading state.
	 */
	getExternalLogins(): CreateQueryResult<ExternalLoginDto[]>
	{
		return injectQuery(
			() => ({
				queryKey: QueryKeys.account.externalLogins,
				queryFn: () =>
					lastValueFrom(
						this.apiService.get<ExternalLoginDto[]>("auth/oauth/linked")),
				...this.queryConfig
			}));
	}

	/**
	 * Mutation to unlink an external OAuth provider from the current user's account.
	 * Invalidates external logins and profile queries on success.
	 * @returns {CreateMutationResult<void, Error, string>}
	 * Mutation that accepts a provider name string.
	 */
	unlinkProvider(): CreateMutationResult<void, Error, string>
	{
		return this.createMutation<string, void>(
			(provider: string) =>
				this.apiService.delete<void>(`auth/oauth/link/${provider}`),
			() =>
			{
				this.queryClient.invalidateQueries(
					{
						queryKey: QueryKeys.account.externalLogins
					});
				this.queryClient.invalidateQueries(
					{
						queryKey: QueryKeys.account.profile
					});
			});
	}
}
