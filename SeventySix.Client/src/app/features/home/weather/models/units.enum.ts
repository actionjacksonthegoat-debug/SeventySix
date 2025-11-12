/**
 * Units for weather data
 */
export enum Units
{
	/**
	 * Temperature in Kelvin, wind speed in m/s
	 */
	Standard = "standard",

	/**
	 * Temperature in Celsius, wind speed in m/s
	 */
	Metric = "metric",

	/**
	 * Temperature in Fahrenheit, wind speed in mph
	 */
	Imperial = "imperial"
}

/**
 * Temperature units for display
 */
export enum TemperatureUnit
{
	Celsius = "°C",
	Fahrenheit = "°F",
	Kelvin = "K"
}

/**
 * Wind speed units for display
 */
export enum WindSpeedUnit
{
	MetersPerSecond = "m/s",
	KilometersPerHour = "km/h",
	MilesPerHour = "mph"
}
