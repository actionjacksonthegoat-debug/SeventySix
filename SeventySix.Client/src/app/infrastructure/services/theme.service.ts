import {
	Injectable,
	signal,
	effect,
	inject,
	PLATFORM_ID,
	computed,
	WritableSignal,
	Signal
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { StorageService } from "./storage.service";

/**
 * Theme brightness types
 */
export type ThemeBrightness = "light" | "dark";

/**
 * Color scheme types
 */
export type ColorScheme = "blue" | "cyan-orange";

/**
 * Service for managing application theme
 * Supports multiple color schemes (blue, cyan-orange) with light/dark modes
 * Persists preferences to localStorage
 */
@Injectable({
	providedIn: "root"
})
export class ThemeService
{
	private platformId: Object = inject(PLATFORM_ID);
	private readonly storage: StorageService = inject(StorageService);
	private readonly BRIGHTNESS_STORAGE_KEY: string =
		"seventysix-theme-brightness";
	private readonly SCHEME_STORAGE_KEY: string = "seventysix-color-scheme";

	/**
	 * Current theme brightness (light/dark)
	 */
	brightness: WritableSignal<ThemeBrightness> = signal<ThemeBrightness>(
		this.getInitialBrightness()
	);

	/**
	 * Current color scheme (blue/cyan-orange)
	 */
	colorScheme: WritableSignal<ColorScheme> = signal<ColorScheme>(
		this.getInitialColorScheme()
	);

	/**
	 * Computed full theme name for display
	 */
	themeName: Signal<string> = computed(() =>
	{
		const brightness: ThemeBrightness = this.brightness();
		const scheme: ColorScheme = this.colorScheme();
		return `${brightness}-${scheme}`;
	});

	constructor()
	{
		// Apply theme changes to document
		effect(() =>
		{
			this.applyTheme(this.brightness(), this.colorScheme());
		});
	}

	/**
	 * Toggle between light and dark brightness
	 */
	toggleBrightness(): void
	{
		this.brightness.update((current) =>
			current === "light" ? "dark" : "light");
	}

	/**
	 * Toggle between color schemes
	 */
	toggleColorScheme(): void
	{
		this.colorScheme.update((current) =>
			current === "blue" ? "cyan-orange" : "blue");
	}

	/**
	 * Set specific brightness
	 */
	setBrightness(brightness: ThemeBrightness): void
	{
		this.brightness.set(brightness);
	}

	/**
	 * Set specific color scheme
	 */
	setColorScheme(scheme: ColorScheme): void
	{
		this.colorScheme.set(scheme);
	}

	/**
	 * Get initial brightness from localStorage or default to light
	 */
	private getInitialBrightness(): ThemeBrightness
	{
		const saved: string | null = this.storage.getItem<string>(
			this.BRIGHTNESS_STORAGE_KEY
		);
		return saved === "dark" || saved === "light" ? saved : "light";
	}

	/**
	 * Get initial color scheme from localStorage or default to blue
	 */
	private getInitialColorScheme(): ColorScheme
	{
		const saved: string | null = this.storage.getItem<string>(
			this.SCHEME_STORAGE_KEY
		);
		return saved === "cyan-orange" ? "cyan-orange" : "blue";
	}

	/**
	 * Apply theme to document and save to localStorage
	 */
	private applyTheme(brightness: ThemeBrightness, scheme: ColorScheme): void
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return;
		}

		const html: HTMLElement = document.documentElement;

		// Remove all theme classes
		html.classList.remove(
			"light-theme",
			"dark-theme",
			"blue-scheme",
			"cyan-orange-scheme"
		);

		// Add current theme classes
		html.classList.add(`${brightness}-theme`);
		html.classList.add(`${scheme}-scheme`);

		// Save to storage
		this.storage.setItem(this.BRIGHTNESS_STORAGE_KEY, brightness);
		this.storage.setItem(this.SCHEME_STORAGE_KEY, scheme);
	}

	/**
	 * Check if current brightness is dark
	 */
	isDark(): boolean
	{
		return this.brightness() === "dark";
	}

	/**
	 * Check if current brightness is light
	 */
	isLight(): boolean
	{
		return this.brightness() === "light";
	}

	/**
	 * Check if current scheme is blue
	 */
	isBlue(): boolean
	{
		return this.colorScheme() === "blue";
	}

	/**
	 * Check if current scheme is cyan-orange
	 */
	isCyanOrange(): boolean
	{
		return this.colorScheme() === "cyan-orange";
	}
}
