import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	HealthStatusResponse,
	DatabaseHealthResponse,
	ExternalApiHealthResponse
} from "@admin/admin-dashboard/models";

@Injectable()
export class HealthApiRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "health";

	/**
	 * Gets overall system health status
	 * @returns Observable of HealthStatusResponse
	 */
	getHealth(): Observable<HealthStatusResponse>
	{
		return this.apiService.get<HealthStatusResponse>(this.endpoint);
	}

	/**
	 * Gets database health status
	 * @returns Observable of DatabaseHealthResponse
	 */
	getDatabaseHealth(): Observable<DatabaseHealthResponse>
	{
		return this.apiService.get<DatabaseHealthResponse>(`${this.endpoint}/database`);
	}

	/**
	 * Gets external API health status
	 * @returns Observable of ExternalApiHealthResponse
	 */
	getExternalApiHealth(): Observable<ExternalApiHealthResponse>
	{
		return this.apiService.get<ExternalApiHealthResponse>(
			`${this.endpoint}/external-apis`
		);
	}
}
