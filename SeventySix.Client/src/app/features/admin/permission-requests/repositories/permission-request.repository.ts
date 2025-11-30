import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	PermissionRequest,
	AvailableRole,
	CreatePermissionRequestDto
} from "@admin/permission-requests/models";

/**
 * Repository for permission request API operations.
 * Provided at route level for proper garbage collection.
 */
@Injectable()
export class PermissionRequestRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "users";

	/** Gets all permission requests (admin only). */
	getAll(): Observable<PermissionRequest[]>
	{
		return this.apiService.get<PermissionRequest[]>(
			`${this.endpoint}/permission-requests`
		);
	}

	/** Gets available roles for current user. */
	getAvailableRoles(): Observable<AvailableRole[]>
	{
		return this.apiService.get<AvailableRole[]>(
			`${this.endpoint}/me/available-roles`
		);
	}

	/** Creates permission requests. */
	create(request: CreatePermissionRequestDto): Observable<void>
	{
		return this.apiService.post<void, CreatePermissionRequestDto>(
			`${this.endpoint}/me/permission-requests`,
			request
		);
	}
}
