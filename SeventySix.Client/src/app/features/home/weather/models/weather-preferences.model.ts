import { Units, TemperatureUnit, WindSpeedUnit } from "./units.enum";

/**
 * User location information
 */
export interface UserLocation
{
	/**
	 * Latitude coordinate
	 */
	latitude: number;

	/**
	 * Longitude coordinate
	 */
	longitude: number;

	/**
	 * City name (optional)
	 */
	city?: string;

	/**
	 * Location accuracy in meters (optional)
	 */
	accuracy?: number;
}

/**
 * User preferences for weather display
 * Stored in localStorage
 */
export interface WeatherPreferences
{
	/**
	 * Whether geolocation permission was granted
	 */
	geolocationGranted: boolean;

	/**
	 * Whether geolocation permission was explicitly denied
	 */
	geolocationDenied: boolean;

	/**
	 * Last known location
	 */
	lastKnownLocation?: UserLocation;

	/**
	 * Preferred units system
	 */
	preferredUnits: Units;

	/**
	 * Preferred temperature unit for display
	 */
	temperatureUnit: TemperatureUnit;

	/**
	 * Preferred wind speed unit for display
	 */
	windSpeedUnit: WindSpeedUnit;

	/**
	 * Whether weather animations are enabled
	 */
	animationsEnabled: boolean;

	/**
	 * Whether user prefers reduced motion
	 * Detected from browser settings
	 */
	reducedMotion: boolean;

	/**
	 * Last time preferences were updated (Unix timestamp)
	 */
	lastUpdated: number;
}

/**
 * Default weather preferences
 */
export const DEFAULT_PREFERENCES: WeatherPreferences = {
	geolocationGranted: false,
	geolocationDenied: false,
	lastKnownLocation: undefined,
	preferredUnits: Units.Metric,
	temperatureUnit: TemperatureUnit.Celsius,
	windSpeedUnit: WindSpeedUnit.MetersPerSecond,
	animationsEnabled: true,
	reducedMotion: false,
	lastUpdated: Date.now()
};
