/**
 * Weather condition information from OpenWeather API
 * Represents one weather condition - multiple can be returned for a single timestamp
 */
export interface WeatherCondition
{
	/**
	 * Weather condition ID
	 * See OpenWeather docs for condition codes
	 */
	id: number;

	/**
	 * Main weather condition group
	 * Examples: Rain, Snow, Clouds, Clear
	 */
	main: string;

	/**
	 * Detailed weather description
	 * Examples: "light rain", "overcast clouds"
	 */
	description: string;

	/**
	 * Weather icon code
	 * Used for displaying weather icons
	 */
	icon: string;
}

/**
 * Get the full URL to the weather icon
 */
export function getWeatherIconUrl(icon: string): string
{
	return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
