import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@infrastructure/api-services/api.service";
import { ThirdPartyApiRequest, ThirdPartyApiStatistics } from "../models";

@Injectable()
export class ThirdPartyApiRepository
{
	private readonly apiService: ApiService = inject(ApiService);
	private readonly endpoint: string = "thirdpartyrequests";

	/**
	 * Gets all third-party API requests
	 * @returns Observable of ThirdPartyApiRequest array
	 */
	getAll(): Observable<ThirdPartyApiRequest[]>
	{
		return this.apiService.get<ThirdPartyApiRequest[]>(this.endpoint);
	}

	/**
	 * Gets third-party API requests filtered by API name
	 * @param apiName - The API name to filter by
	 * @returns Observable of ThirdPartyApiRequest array
	 */
	getByApiName(apiName: string): Observable<ThirdPartyApiRequest[]>
	{
		const encodedName: string = encodeURIComponent(apiName);
		return this.apiService.get<ThirdPartyApiRequest[]>(
			`${this.endpoint}/${encodedName}`
		);
	}

	/**
	 * Gets third-party API statistics
	 * @returns Observable of ThirdPartyApiStatistics
	 */
	getStatistics(): Observable<ThirdPartyApiStatistics>
	{
		return this.apiService.get<ThirdPartyApiStatistics>(
			`${this.endpoint}/statistics`
		);
	}
}
