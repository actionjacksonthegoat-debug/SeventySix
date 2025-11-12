/**
 * Minute-by-minute precipitation forecast for the next hour
 */
export interface MinutelyForecast
{
	/**
	 * Forecast time (Unix UTC timestamp in seconds)
	 */
	dt: number;

	/**
	 * Precipitation volume (mm)
	 */
	precipitation: number;
}
