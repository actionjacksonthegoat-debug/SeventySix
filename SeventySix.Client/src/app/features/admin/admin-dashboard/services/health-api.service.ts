import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import {
	HealthStatus,
	DatabaseHealth,
	ExternalApiHealth
} from "@admin/admin-dashboard/models";

/**
 * Service for managing health check data
 */
@Injectable({
	providedIn: "root"
})
export class HealthApiService
{
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/health`;

	/**
	 * Gets overall system health status
	 * @returns Observable of HealthStatus
	 */
	getHealth(): Observable<HealthStatus>
	{
		return this.http.get<HealthStatus>(this.apiUrl);
	}

	/**
	 * Gets database health status
	 * @returns Observable of DatabaseHealth
	 */
	getDatabaseHealth(): Observable<DatabaseHealth>
	{
		return this.http.get<DatabaseHealth>(`${this.apiUrl}/database`);
	}

	/**
	 * Gets external API health status
	 * @returns Observable of ExternalApiHealth
	 */
	getExternalApiHealth(): Observable<ExternalApiHealth>
	{
		return this.http.get<ExternalApiHealth>(`${this.apiUrl}/external-apis`);
	}
}
