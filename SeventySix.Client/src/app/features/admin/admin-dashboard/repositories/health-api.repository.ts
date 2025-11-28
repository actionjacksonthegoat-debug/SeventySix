import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	HealthStatus,
	DatabaseHealth,
	ExternalApiHealth
} from "@admin/admin-dashboard/models";

@Injectable()
export class HealthApiRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "health";

	/**
	 * Gets overall system health status
	 * @returns Observable of HealthStatus
	 */
	getHealth(): Observable<HealthStatus>
	{
		return this.apiService.get<HealthStatus>(this.endpoint);
	}

	/**
	 * Gets database health status
	 * @returns Observable of DatabaseHealth
	 */
	getDatabaseHealth(): Observable<DatabaseHealth>
	{
		return this.apiService.get<DatabaseHealth>(`${this.endpoint}/database`);
	}

	/**
	 * Gets external API health status
	 * @returns Observable of ExternalApiHealth
	 */
	getExternalApiHealth(): Observable<ExternalApiHealth>
	{
		return this.apiService.get<ExternalApiHealth>(
			`${this.endpoint}/external-apis`
		);
	}
}
