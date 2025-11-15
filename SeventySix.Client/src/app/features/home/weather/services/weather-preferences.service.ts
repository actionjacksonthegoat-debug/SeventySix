import {
	Injectable,
	signal,
	Signal,
	WritableSignal,
	computed
} from "@angular/core";
import {
	WeatherPreferences,
	DEFAULT_PREFERENCES,
	Units,
	TemperatureUnit,
	WindSpeedUnit
} from "@home/weather/models";

/**
 * Service for managing user weather preferences
 * Uses localStorage for persistence and signals for reactivity
 */
@Injectable({
	providedIn: "root"
})
export class WeatherPreferencesService
{
	private readonly STORAGE_KEY: string = "weatherPreferences";
	private readonly preferences: WritableSignal<WeatherPreferences> =
		signal<WeatherPreferences>(DEFAULT_PREFERENCES);

	// Public computed signals for specific preferences
	public readonly units: Signal<Units> = computed(
		() => this.preferences().preferredUnits
	);
	public readonly temperatureUnit: Signal<string> = computed(
		() => this.preferences().temperatureUnit
	);
	public readonly windSpeedUnit: Signal<string> = computed(
		() => this.preferences().windSpeedUnit
	);
	public readonly animationsEnabled: Signal<boolean> = computed(
		() => this.preferences().animationsEnabled
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
		const current: WeatherPreferences = this.preferences();
		const updated: WeatherPreferences = {
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
		const saved: string | null = localStorage.getItem(this.STORAGE_KEY);
		if (saved)
		{
			try
			{
				const preferences: WeatherPreferences = JSON.parse(
					saved
				) as WeatherPreferences;
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
		const reducedMotion: boolean = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		if (reducedMotion !== this.preferences().reducedMotion)
		{
			this.updatePreferences({ reducedMotion });
		}
	}
}
