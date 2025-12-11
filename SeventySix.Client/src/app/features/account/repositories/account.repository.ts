import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	UserProfileDto,
	UpdateProfileRequest,
	AvailableRoleDto,
	CreatePermissionRequestDto
} from "../models";

/** Repository for current user's account operations. Uses /users/me endpoints. */
@Injectable()
export class AccountRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users/me";

	getProfile(): Observable<UserProfileDto>
	{
		return this.apiService.get<UserProfileDto>("auth/me");
	}

	updateProfile(request: UpdateProfileRequest): Observable<UserProfileDto>
	{
		return this.apiService.put<UserProfileDto>(this.endpoint, request);
	}

	getAvailableRoles(): Observable<AvailableRoleDto[]>
	{
		return this.apiService.get<AvailableRoleDto[]>(
			`${this.endpoint}/available-roles`
		);
	}

	createPermissionRequest(
		request: CreatePermissionRequestDto
	): Observable<void>
	{
		return this.apiService.post<void, CreatePermissionRequestDto>(
			`${this.endpoint}/permission-requests`,
			request
		);
	}
}
