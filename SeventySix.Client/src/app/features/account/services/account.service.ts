import { inject, Injectable } from "@angular/core";
import {
	injectQuery,
	injectMutation,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { lastValueFrom } from "rxjs";
import { AccountRepository } from "../repositories";
import { UpdateProfileRequest, CreatePermissionRequest } from "../models";
import { getQueryConfig } from "@infrastructure/utils/query-config";
import { QueryKeys } from "@infrastructure/utils/query-keys";

/** Service for current user's account operations. Provided at route level. */
@Injectable()
export class AccountService
{
	private readonly accountRepository: AccountRepository =
		inject(AccountRepository);
	private readonly queryClient: QueryClient = inject(QueryClient);
	private readonly queryConfig: ReturnType<typeof getQueryConfig> =
		getQueryConfig("account");

	getProfile()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.account.profile,
			queryFn: () => lastValueFrom(this.accountRepository.getProfile()),
			...this.queryConfig
		}));
	}

	updateProfile()
	{
		return injectMutation(() => ({
			mutationFn: (request: UpdateProfileRequest) =>
				lastValueFrom(this.accountRepository.updateProfile(request)),
			onSuccess: () =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.account.all
				});
			}
		}));
	}

	getAvailableRoles()
	{
		return injectQuery(() => ({
			queryKey: QueryKeys.account.availableRoles,
			queryFn: () =>
				lastValueFrom(this.accountRepository.getAvailableRoles()),
			...this.queryConfig
		}));
	}

	createPermissionRequest()
	{
		return injectMutation(() => ({
			mutationFn: (request: CreatePermissionRequest) =>
				lastValueFrom(
					this.accountRepository.createPermissionRequest(request)
				),
			onSuccess: () =>
			{
				this.queryClient.invalidateQueries({
					queryKey: QueryKeys.account.availableRoles
				});
			}
		}));
	}
}
