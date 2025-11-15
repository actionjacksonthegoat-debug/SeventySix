import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
	OneCallResponse,
	CurrentWeather,
	HourlyForecast,
	DailyForecast,
	MinutelyForecast
} from "@home/weather/models";

/**
 * Options for weather API requests
 */
export interface WeatherOptions
{
	/**
	 * Units of measurement
	 * standard (Kelvin), metric (Celsius), imperial (Fahrenheit)
	 */
	units?: "standard" | "metric" | "imperial";

	/**
	 * Language for weather description
	 */
	lang?: string;
}

/**
 * API quota status response
 */
export interface QuotaStatus
{
	/**
	 * Daily API call limit
	 */
	dailyLimit: number;

	/**
	 * Remaining API calls
	 */
	remainingCalls: number;

	/**
	 * Time when quota resets (ISO string)
	 */
	resetTime: string;
}

/**
 * Service for interacting with OpenWeather API endpoints
 * Provides methods to fetch current weather, forecasts, and historical data
 */
@Injectable({
	providedIn: "root"
})
export class OpenWeatherService
{
	private readonly http: HttpClient = inject(HttpClient);
	private readonly apiBaseUrl: string = environment.openWeatherMapApiUrl;

	/**
	 * Get complete weather data (current + forecasts + alerts)
	 * Calls OneCall API 3.0 endpoint
	 *
	 * @param lat Latitude (-90 to 90)
	 * @param lon Longitude (-180 to 180)
	 * @param options Optional request parameters
	 * @returns Observable of OneCallResponse
	 */
	getCompleteWeather(
		lat: number,
		lon: number,
		options?: WeatherOptions
	): Observable<OneCallResponse>
	{
		let params: HttpParams = new HttpParams()
			.set("latitude", lat.toString())
			.set("longitude", lon.toString());

		if (options?.units)
		{
			params = params.set("units", options.units);
		}

		if (options?.lang)
		{
			params = params.set("lang", options.lang);
		}

		return this.http.get<OneCallResponse>(this.apiBaseUrl, { params });
	}

	/**
	 * Get current weather only
	 *
	 * @param lat Latitude
	 * @param lon Longitude
	 * @param options Optional request parameters
	 * @returns Observable of CurrentWeather
	 */
	getCurrentWeather(
		lat: number,
		lon: number,
		options?: WeatherOptions
	): Observable<CurrentWeather>
	{
		let params: HttpParams = new HttpParams()
			.set("latitude", lat.toString())
			.set("longitude", lon.toString());

		if (options?.units)
		{
			params = params.set("units", options.units);
		}

		if (options?.lang)
		{
			params = params.set("lang", options.lang);
		}

		return this.http.get<CurrentWeather>(`${this.apiBaseUrl}/current`, {
			params
		});
	}

	/**
	 * Get hourly forecast (48 hours)
	 *
	 * @param lat Latitude
	 * @param lon Longitude
	 * @param options Optional request parameters
	 * @returns Observable of HourlyForecast array
	 */
	getHourlyForecast(
		lat: number,
		lon: number,
		options?: WeatherOptions
	): Observable<HourlyForecast[]>
	{
		let params: HttpParams = new HttpParams()
			.set("latitude", lat.toString())
			.set("longitude", lon.toString());

		if (options?.units)
		{
			params = params.set("units", options.units);
		}

		if (options?.lang)
		{
			params = params.set("lang", options.lang);
		}

		return this.http.get<HourlyForecast[]>(`${this.apiBaseUrl}/hourly`, {
			params
		});
	}

	/**
	 * Get daily forecast (8 days)
	 *
	 * @param lat Latitude
	 * @param lon Longitude
	 * @param options Optional request parameters
	 * @returns Observable of DailyForecast array
	 */
	getDailyForecast(
		lat: number,
		lon: number,
		options?: WeatherOptions
	): Observable<DailyForecast[]>
	{
		let params: HttpParams = new HttpParams()
			.set("latitude", lat.toString())
			.set("longitude", lon.toString());

		if (options?.units)
		{
			params = params.set("units", options.units);
		}

		if (options?.lang)
		{
			params = params.set("lang", options.lang);
		}

		return this.http.get<DailyForecast[]>(`${this.apiBaseUrl}/daily`, {
			params
		});
	}

	/**
	 * Get minutely precipitation forecast (60 minutes)
	 *
	 * @param lat Latitude
	 * @param lon Longitude
	 * @param options Optional request parameters
	 * @returns Observable of MinutelyForecast array
	 */
	getMinutelyForecast(
		lat: number,
		lon: number,
		options?: WeatherOptions
	): Observable<MinutelyForecast[]>
	{
		let params: HttpParams = new HttpParams()
			.set("latitude", lat.toString())
			.set("longitude", lon.toString());

		if (options?.units)
		{
			params = params.set("units", options.units);
		}

		if (options?.lang)
		{
			params = params.set("lang", options.lang);
		}

		return this.http.get<MinutelyForecast[]>(
			`${this.apiBaseUrl}/minutely`,
			{ params }
		);
	}

	/**
	 * Get historical weather data
	 *
	 * @param lat Latitude
	 * @param lon Longitude
	 * @param timestamp Unix timestamp (seconds)
	 * @param options Optional request parameters
	 * @returns Observable of OneCallResponse (historical data)
	 */
	getHistoricalWeather(
		lat: number,
		lon: number,
		timestamp: number,
		options?: WeatherOptions
	): Observable<OneCallResponse>
	{
		let params: HttpParams = new HttpParams()
			.set("latitude", lat.toString())
			.set("longitude", lon.toString())
			.set("timestamp", timestamp.toString());

		if (options?.units)
		{
			params = params.set("units", options.units);
		}

		if (options?.lang)
		{
			params = params.set("lang", options.lang);
		}

		return this.http.get<OneCallResponse>(`${this.apiBaseUrl}/historical`, {
			params
		});
	}

	/**
	 * Get API quota status
	 *
	 * @returns Observable of QuotaStatus
	 */
	getQuotaStatus(): Observable<QuotaStatus>
	{
		return this.http.get<QuotaStatus>(`${this.apiBaseUrl}/quota`);
	}
}
