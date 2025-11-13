import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "@environments/environment";
import {
	ThirdPartyApiRequest,
	ThirdPartyApiStatistics
} from "../../../core/models/admin";

/**
 * Service for managing third-party API request data
 */
@Injectable({
	providedIn: "root"
})
export class ThirdPartyApiService
{
	private readonly http = inject(HttpClient);
	private readonly apiUrl = `${environment.apiUrl}/ThirdPartyApiRequest`;

	/**
	 * Gets all third-party API requests
	 * @returns Observable of ThirdPartyApiRequest array
	 */
	getAll(): Observable<ThirdPartyApiRequest[]>
	{
		return this.http.get<ThirdPartyApiRequest[]>(this.apiUrl);
	}

	/**
	 * Gets third-party API requests filtered by API name
	 * @param apiName - The API name to filter by
	 * @returns Observable of ThirdPartyApiRequest array
	 */
	getByApiName(apiName: string): Observable<ThirdPartyApiRequest[]>
	{
		const encodedName = encodeURIComponent(apiName);
		return this.http.get<ThirdPartyApiRequest[]>(
			`${this.apiUrl}/${encodedName}`
		);
	}

	/**
	 * Gets third-party API statistics
	 * @returns Observable of ThirdPartyApiStatistics
	 */
	getStatistics(): Observable<ThirdPartyApiStatistics>
	{
		return this.http.get<ThirdPartyApiStatistics>(
			`${this.apiUrl}/statistics`
		);
	}
}
