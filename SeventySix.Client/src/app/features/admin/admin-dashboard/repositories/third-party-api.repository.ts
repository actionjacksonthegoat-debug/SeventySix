import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import {
	ThirdPartyApiRequestResponse,
	ThirdPartyApiStatisticsResponse
} from "@admin/admin-dashboard/models";

@Injectable()
export class ThirdPartyApiRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "thirdpartyrequests";

	/**
	 * Gets all third-party API requests
	 * @returns Observable of ThirdPartyApiRequestResponse array
	 */
	getAll(): Observable<ThirdPartyApiRequestResponse[]>
	{
		return this.apiService.get<ThirdPartyApiRequestResponse[]>(this.endpoint);
	}

	/**
	 * Gets third-party API requests filtered by API name
	 * @param apiName - The API name to filter by
	 * @returns Observable of ThirdPartyApiRequestResponse array
	 */
	getByApiName(apiName: string): Observable<ThirdPartyApiRequestResponse[]>
	{
		const encodedName: string = encodeURIComponent(apiName);
		return this.apiService.get<ThirdPartyApiRequestResponse[]>(
			`${this.endpoint}/${encodedName}`
		);
	}

	/**
	 * Gets third-party API statistics
	 * @returns Observable of ThirdPartyApiStatisticsResponse
	 */
	getStatistics(): Observable<ThirdPartyApiStatisticsResponse>
	{
		return this.apiService.get<ThirdPartyApiStatisticsResponse>(
			`${this.endpoint}/statistics`
		);
	}
}
