import { WeatherCondition } from "./weather-condition.model";
import { Temperature, FeelsLike } from "./temperature.model";

/**
 * Daily weather forecast (8 days)
 */
export interface DailyForecast
{
	/**
	 * Forecast time (Unix UTC timestamp, midnight)
	 */
	dt: number;

	/**
	 * Sunrise time (Unix UTC timestamp)
	 */
	sunrise: number;

	/**
	 * Sunset time (Unix UTC timestamp)
	 */
	sunset: number;

	/**
	 * Moonrise time (Unix UTC timestamp)
	 */
	moonrise: number;

	/**
	 * Moonset time (Unix UTC timestamp)
	 */
	moonset: number;

	/**
	 * Moon phase (0-1)
	 * 0 and 1 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter
	 */
	moon_phase: number;

	/**
	 * Temperature throughout the day
	 */
	temp: Temperature;

	/**
	 * "Feels like" temperature throughout the day
	 */
	feels_like: FeelsLike;

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
	 * Rain volume (mm, optional)
	 */
	rain?: number;

	/**
	 * Snow volume (mm, optional)
	 */
	snow?: number;

	/**
	 * Weather conditions array
	 */
	weather: WeatherCondition[];

	/**
	 * Summary of the day's weather (optional)
	 */
	summary?: string;
}
