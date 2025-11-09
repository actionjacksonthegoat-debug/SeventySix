/**
 * Weather Service
 * Business logic layer for weather forecast operations
 * Uses repository pattern for data access (SRP, DIP)
 */

import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { WeatherForecast } from "@core/models/interfaces/weather-forecast";
import { WeatherForecastRepository } from "@core/repositories/weather-forecast.repository";

/**
 * Service for weather forecast business logic
 */
@Injectable({
	providedIn: "root"
})
export class WeatherService
{
	private readonly weatherRepository = inject(WeatherForecastRepository);

	/**
	 * Get all weather forecasts
	 * @returns Observable of weather forecast array
	 */
	getAllForecasts(): Observable<WeatherForecast[]>
	{
		return this.weatherRepository.getAll();
	}

	/**
	 * Get weather forecast by ID
	 * @param id The forecast identifier
	 * @returns Observable of weather forecast
	 */
	getForecastById(id: number | string): Observable<WeatherForecast>
	{
		return this.weatherRepository.getById(id);
	}

	/**
	 * Create new weather forecast
	 * @param forecast The forecast data
	 * @returns Observable of created forecast
	 */
	createForecast(
		forecast: Partial<WeatherForecast>
	): Observable<WeatherForecast>
	{
		return this.weatherRepository.create(forecast);
	}

	/**
	 * Update existing weather forecast
	 * @param id The forecast identifier
	 * @param forecast The forecast data to update
	 * @returns Observable of updated forecast
	 */
	updateForecast(
		id: number | string,
		forecast: Partial<WeatherForecast>
	): Observable<WeatherForecast>
	{
		return this.weatherRepository.update(id, forecast);
	}

	/**
	 * Delete weather forecast
	 * @param id The forecast identifier
	 * @returns Observable of void
	 */
	deleteForecast(id: number | string): Observable<void>
	{
		return this.weatherRepository.delete(id);
	}
}
