import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@core/api-services/api.service";
import {
	HealthStatus,
	DatabaseHealth,
	ExternalApiHealth,
	HealthStatusSchema,
	DatabaseHealthSchema,
	ExternalApiHealthSchema
} from "@admin/admin-dashboard/models";

/**
 * Service for managing health check data
 */
@Injectable({
	providedIn: "root"
})
export class HealthApiService
{
	private readonly apiService: ApiService = inject(ApiService);

	/**
	 * Gets overall system health status
	 * @returns Observable of HealthStatus
	 */
	getHealth(): Observable<HealthStatus>
	{
		return this.apiService.get<HealthStatus>(
			"health",
			undefined,
			HealthStatusSchema
		);
	}

	/**
	 * Gets database health status
	 * @returns Observable of DatabaseHealth
	 */
	getDatabaseHealth(): Observable<DatabaseHealth>
	{
		return this.apiService.get<DatabaseHealth>(
			"health/database",
			undefined,
			DatabaseHealthSchema
		);
	}

	/**
	 * Gets external API health status
	 * @returns Observable of ExternalApiHealth
	 */
	getExternalApiHealth(): Observable<ExternalApiHealth>
	{
		return this.apiService.get<ExternalApiHealth>(
			"health/external-apis",
			undefined,
			ExternalApiHealthSchema
		);
	}
}
