import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	Profile,
	UpdateProfileRequest,
	AvailableRole,
	CreatePermissionRequest
} from "../models";

/** Repository for current user's account operations. Uses /users/me endpoints. */
@Injectable()
export class AccountRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users/me";

	getProfile(): Observable<Profile>
	{
		return this.apiService.get<Profile>(this.endpoint);
	}

	updateProfile(request: UpdateProfileRequest): Observable<Profile>
	{
		return this.apiService.put<Profile>(
			this.endpoint,
			request
		);
	}

	getAvailableRoles(): Observable<AvailableRole[]>
	{
		return this.apiService.get<AvailableRole[]>(`${this.endpoint}/available-roles`);
	}

	createPermissionRequest(request: CreatePermissionRequest): Observable<void>
	{
		return this.apiService.post<void, CreatePermissionRequest>(
			`${this.endpoint}/permission-requests`,
			request
		);
	}
}
