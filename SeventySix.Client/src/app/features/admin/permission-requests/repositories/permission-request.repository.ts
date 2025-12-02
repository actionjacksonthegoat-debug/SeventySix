import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	PermissionRequest,
	AvailableRole,
	CreatePermissionRequest
} from "../models";

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
	create(request: CreatePermissionRequest): Observable<void>
	{
		return this.apiService.post<void, CreatePermissionRequest>(
			`${this.endpoint}/me/permission-requests`,
			request
		);
	}

	/** Approves a single permission request. */
	approve(id: number): Observable<void>
	{
		return this.apiService.post<void, Record<string, never>>(
			`${this.endpoint}/permission-requests/${id}/approve`,
			{}
		);
	}

	/** Rejects a single permission request. */
	reject(id: number): Observable<void>
	{
		return this.apiService.post<void, Record<string, never>>(
			`${this.endpoint}/permission-requests/${id}/reject`,
			{}
		);
	}

	/** Bulk approves permission requests. */
	bulkApprove(ids: number[]): Observable<number>
	{
		return this.apiService.post<number, number[]>(
			`${this.endpoint}/permission-requests/bulk/approve`,
			ids
		);
	}

	/** Bulk rejects permission requests. */
	bulkReject(ids: number[]): Observable<number>
	{
		return this.apiService.post<number, number[]>(
			`${this.endpoint}/permission-requests/bulk/reject`,
			ids
		);
	}
}
