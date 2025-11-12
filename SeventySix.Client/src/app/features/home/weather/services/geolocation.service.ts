import { Injectable, signal, Signal } from "@angular/core";
import { Observable } from "rxjs";
import { UserLocation } from "../models";

/**
 * Geolocation error with code and message
 */
export interface GeolocationError
{
	code: number;
	message: string;
}

/**
 * Service for handling browser geolocation API
 * Provides reactive access to user location with permissions handling
 */
@Injectable({
	providedIn: "root"
})
export class GeolocationService
{
	private readonly currentLocation = signal<UserLocation | undefined>(
		undefined
	);
	private readonly permissionGranted = signal<boolean>(false);
	private readonly STORAGE_KEY = "weatherLocation";

	/**
	 * Default geolocation options
	 */
	private readonly defaultOptions: PositionOptions = {
		enableHighAccuracy: false, // Save battery
		timeout: 10000, // 10 second timeout
		maximumAge: 300000 // Cache for 5 minutes
	};

	constructor()
	{
		this.loadLocationFromStorage();
	}

	/**
	 * Request user's current location
	 * Prompts for permissions if not already granted
	 *
	 * @param options Optional geolocation options
	 * @returns Observable of GeolocationPosition
	 */
	requestLocation(
		options?: PositionOptions
	): Observable<GeolocationPosition>
	{
		return new Observable<GeolocationPosition>((observer) =>
		{
			if (!navigator.geolocation)
			{
				observer.error({
					code: 0,
					message: "Geolocation is not supported by this browser"
				} as GeolocationError);
				return;
			}

			const positionOptions = { ...this.defaultOptions, ...options };

			navigator.geolocation.getCurrentPosition(
				(position) =>
				{
					// Update signals
					const userLocation: UserLocation = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						accuracy: position.coords.accuracy
					};

					this.currentLocation.set(userLocation);
					this.permissionGranted.set(true);

					// Save to localStorage
					this.saveLocationToStorage(userLocation);

					observer.next(position);
					observer.complete();
				},
				(error) =>
				{
					// Handle geolocation errors
					const geolocationError: GeolocationError = {
						code: error.code,
						message: this.getErrorMessage(error.code)
					};

					// Don't update permission for timeout/unavailable errors
					if (error.code === error.PERMISSION_DENIED)
					{
						this.permissionGranted.set(false);
						localStorage.setItem(
							"weatherGeolocationDenied",
							"true"
						);
					}

					observer.error(geolocationError);
				},
				positionOptions
			);
		});
	}

	/**
	 * Get current location as a signal
	 * @returns Signal of UserLocation or undefined
	 */
	getCurrentLocation(): Signal<UserLocation | undefined>
	{
		return this.currentLocation.asReadonly();
	}

	/**
	 * Check if geolocation permission was granted
	 * @returns Signal of boolean
	 */
	hasPermission(): Signal<boolean>
	{
		return this.permissionGranted.asReadonly();
	}

	/**
	 * Clear saved location from localStorage
	 */
	clearSavedLocation(): void
	{
		localStorage.removeItem(this.STORAGE_KEY);
		localStorage.removeItem("weatherGeolocationDenied");
		this.currentLocation.set(undefined);
		this.permissionGranted.set(false);
	}

	/**
	 * Load location from localStorage on service init
	 */
	private loadLocationFromStorage(): void
	{
		const saved = localStorage.getItem(this.STORAGE_KEY);
		if (saved)
		{
			try
			{
				const location = JSON.parse(saved) as UserLocation;
				this.currentLocation.set(location);
				this.permissionGranted.set(true);
			}
			catch
			{
				// Invalid JSON, ignore
				localStorage.removeItem(this.STORAGE_KEY);
			}
		}
	}

	/**
	 * Save location to localStorage
	 */
	private saveLocationToStorage(location: UserLocation): void
	{
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));
	}

	/**
	 * Get user-friendly error message for geolocation error code
	 */
	private getErrorMessage(code: number): string
	{
		switch (code)
		{
			case 1: // PERMISSION_DENIED
				return "User denied geolocation permission";
			case 2: // POSITION_UNAVAILABLE
				return "Location information is unavailable";
			case 3: // TIMEOUT
				return "Location request timed out";
			default:
				return "An unknown error occurred";
		}
	}
}
