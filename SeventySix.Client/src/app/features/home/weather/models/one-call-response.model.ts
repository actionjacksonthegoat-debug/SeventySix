import { CurrentWeather } from "./current-weather.model";
import { MinutelyForecast } from "./minutely-forecast.model";
import { HourlyForecast } from "./hourly-forecast.model";
import { DailyForecast } from "./daily-forecast.model";
import { WeatherAlert } from "./weather-alert.model";

/**
 * Complete response from OpenWeather One Call API 3.0
 * Contains current weather, forecasts, and alerts for a specific location
 * API documentation: https://openweathermap.org/api/one-call-3
 */
export interface OneCallResponse
{
	/**
	 * Latitude of the location
	 */
	lat: number;

	/**
	 * Longitude of the location
	 */
	lon: number;

	/**
	 * Timezone name
	 * Example: "America/New_York"
	 */
	timezone: string;

	/**
	 * Timezone offset from UTC (seconds)
	 */
	timezone_offset: number;

	/**
	 * Current weather data
	 */
	current?: CurrentWeather;

	/**
	 * Minutely precipitation forecast (next hour)
	 * Only available for locations where minute forecast is supported
	 */
	minutely?: MinutelyForecast[];

	/**
	 * Hourly forecast (48 hours)
	 */
	hourly?: HourlyForecast[];

	/**
	 * Daily forecast (8 days)
	 */
	daily?: DailyForecast[];

	/**
	 * Weather alerts
	 * Only present if there are active alerts for the location
	 */
	alerts?: WeatherAlert[];
}
