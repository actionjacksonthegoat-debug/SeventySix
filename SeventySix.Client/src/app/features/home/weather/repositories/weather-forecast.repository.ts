/**
 * Weather Forecast Repository
 * Handles data access for weather forecast entities
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "@core/api-services/api.service";
import { WeatherForecast } from "@home/weather/models/weather-forecast.model";
import { IRepository } from "@core/repositories/base.repository";

/**
 * Repository for weather forecast data access
 */
@Injectable({
	providedIn: "root"
})
export class WeatherForecastRepository implements IRepository<WeatherForecast>
{
	private readonly apiService = inject(ApiService);
	private readonly endpoint = "WeatherForecast";

	/**
	 * Get all weather forecasts
	 */
	getAll(): Observable<WeatherForecast[]>
	{
		return this.apiService.get<WeatherForecast[]>(this.endpoint);
	}

	/**
	 * Get weather forecast by ID
	 * @param id The forecast identifier
	 */
	getById(id: number | string): Observable<WeatherForecast>
	{
		return this.apiService.get<WeatherForecast>(`${this.endpoint}/${id}`);
	}

	/**
	 * Create new weather forecast
	 * @param forecast The forecast data to create
	 */
	create(forecast: Partial<WeatherForecast>): Observable<WeatherForecast>
	{
		return this.apiService.post<WeatherForecast>(this.endpoint, forecast);
	}

	/**
	 * Update existing weather forecast
	 * @param id The forecast identifier
	 * @param forecast The forecast data to update
	 */
	update(
		id: number | string,
		forecast: Partial<WeatherForecast>
	): Observable<WeatherForecast>
	{
		return this.apiService.put<WeatherForecast>(
			`${this.endpoint}/${id}`,
			forecast
		);
	}

	/**
	 * Delete weather forecast
	 * @param id The forecast identifier
	 */
	delete(id: number | string): Observable<void>
	{
		return this.apiService.delete<void>(`${this.endpoint}/${id}`);
	}
}
