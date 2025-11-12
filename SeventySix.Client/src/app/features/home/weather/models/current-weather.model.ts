import { WeatherCondition } from "./weather-condition.model";
import { Precipitation } from "./precipitation.model";

/**
 * Current weather data from OpenWeather One Call API 3.0
 */
export interface CurrentWeather
{
	/**
	 * Current time (Unix UTC timestamp in seconds)
	 */
	dt: number;

	/**
	 * Sunrise time (Unix UTC timestamp in seconds)
	 */
	sunrise: number;

	/**
	 * Sunset time (Unix UTC timestamp in seconds)
	 */
	sunset: number;

	/**
	 * Temperature (units depend on request)
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
