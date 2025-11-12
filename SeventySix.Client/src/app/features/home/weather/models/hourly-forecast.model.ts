import { WeatherCondition } from "./weather-condition.model";
import { Precipitation } from "./precipitation.model";

/**
 * Hourly weather forecast (48 hours)
 */
export interface HourlyForecast
{
	/**
	 * Forecast time (Unix UTC timestamp in seconds)
	 */
	dt: number;

	/**
	 * Temperature
	 */
	temp: number;

	/**
	 * "Feels like" temperature
	 */
	feels_like: number;

	/**
	 * Atmospheric pressure (hPa)
	 */
	pressure: number;

	/**
	 * Humidity percentage (0-100)
	 */
	humidity: number;

	/**
	 * Dew point temperature
	 */
	dew_point: number;

	/**
	 * Cloudiness percentage (0-100)
	 */
	clouds: number;

	/**
	 * UV index
	 */
	uvi: number;

	/**
	 * Visibility in meters
	 */
	visibility: number;

	/**
	 * Wind speed
	 */
	wind_speed: number;

	/**
	 * Wind direction in degrees (meteorological)
	 */
	wind_deg: number;

	/**
	 * Wind gust speed (optional)
	 */
	wind_gust?: number;

	/**
	 * Probability of precipitation (0-1)
	 */
	pop: number;

	/**
	 * Weather conditions array
	 */
	weather: WeatherCondition[];

	/**
	 * Rain data (optional)
	 */
	rain?: Precipitation;

	/**
	 * Snow data (optional)
	 */
	snow?: Precipitation;
}
