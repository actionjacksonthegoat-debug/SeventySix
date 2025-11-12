import { Injectable, signal, Signal, computed } from "@angular/core";
import {
	WeatherPreferences,
	DEFAULT_PREFERENCES,
	Units,
	TemperatureUnit,
	WindSpeedUnit
} from "../models";

/**
 * Service for managing user weather preferences
 * Uses localStorage for persistence and signals for reactivity
 */
@Injectable({
	providedIn: "root"
})
export class WeatherPreferencesService
{
	private readonly STORAGE_KEY = "weatherPreferences";
	private readonly preferences =
		signal<WeatherPreferences>(DEFAULT_PREFERENCES);

	// Public computed signals for specific preferences
	public readonly units = computed(() => this.preferences().preferredUnits);
	public readonly temperatureUnit = computed(
		() => this.preferences().temperatureUnit
	);
	public readonly windSpeedUnit = computed(
		() => this.preferences().windSpeedUnit
	);
	public readonly animationsEnabled = computed(
		() => this.preferences().animationsEnabled
	);
	public readonly reducedMotion = computed(
		() => this.preferences().reducedMotion
	);

	constructor()
	{
		this.loadPreferences();
		this.detectReducedMotion();
	}

	/**
	 * Get all preferences as a signal
	 */
	getPreferences(): Signal<WeatherPreferences>
	{
		return this.preferences.asReadonly();
	}

	/**
	 * Update preferences
	 */
	updatePreferences(updates: Partial<WeatherPreferences>): void
	{
		const current = this.preferences();
		const updated = {
			...current,
			...updates,
			lastUpdated: Date.now()
		};

		this.preferences.set(updated);
		this.savePreferences(updated);
	}

	/**
	 * Set preferred units
	 */
	setUnits(units: Units): void
	{
		this.updatePreferences({ preferredUnits: units });
	}

	/**
	 * Set temperature unit
	 */
	setTemperatureUnit(unit: TemperatureUnit): void
	{
		this.updatePreferences({ temperatureUnit: unit });
	}

	/**
	 * Set wind speed unit
	 */
	setWindSpeedUnit(unit: WindSpeedUnit): void
	{
		this.updatePreferences({ windSpeedUnit: unit });
	}

	/**
	 * Toggle animations
	 */
	toggleAnimations(): void
	{
		this.updatePreferences({
			animationsEnabled: !this.preferences().animationsEnabled
		});
	}

	/**
	 * Reset preferences to defaults
	 */
	resetPreferences(): void
	{
		this.preferences.set(DEFAULT_PREFERENCES);
		localStorage.removeItem(this.STORAGE_KEY);
	}

	/**
	 * Load preferences from localStorage
	 */
	private loadPreferences(): void
	{
		const saved = localStorage.getItem(this.STORAGE_KEY);
		if (saved)
		{
			try
			{
				const preferences = JSON.parse(saved) as WeatherPreferences;
				this.preferences.set(preferences);
			}
			catch
			{
				// Invalid JSON, use defaults
				localStorage.removeItem(this.STORAGE_KEY);
			}
		}
	}

	/**
	 * Save preferences to localStorage
	 */
	private savePreferences(preferences: WeatherPreferences): void
	{
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
	}

	/**
	 * Detect reduced motion preference from browser
	 */
	private detectReducedMotion(): void
	{
		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		if (reducedMotion !== this.preferences().reducedMotion)
		{
			this.updatePreferences({ reducedMotion });
		}
	}
}
