/**
 * Temperature information for daily forecast
 */
export interface Temperature
{
	/**
	 * Morning temperature
	 */
	morn: number;

	/**
	 * Day temperature
	 */
	day: number;

	/**
	 * Evening temperature
	 */
	eve: number;

	/**
	 * Night temperature
	 */
	night: number;

	/**
	 * Minimum daily temperature
	 */
	min: number;

	/**
	 * Maximum daily temperature
	 */
	max: number;
}

/**
 * "Feels like" temperature information for daily forecast
 */
export interface FeelsLike
{
	/**
	 * Morning "feels like" temperature
	 */
	morn: number;

	/**
	 * Day "feels like" temperature
	 */
	day: number;

	/**
	 * Evening "feels like" temperature
	 */
	eve: number;

	/**
	 * Night "feels like" temperature
	 */
	night: number;
}
