import { isPlatformBrowser } from "@angular/common";
import {
	computed,
	effect,
	inject,
	Injectable,
	PLATFORM_ID,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { ColorScheme } from "@shared/models/color-scheme.model";
import { ThemeBrightness } from "@shared/models/theme.model";
import { StorageService } from "@shared/services/storage.service";

/**
 * Service for managing application theme
 * Supports multiple color schemes (blue, cyan-orange) with light/dark modes
 * Persists preferences to localStorage
 */
@Injectable(
	{
		providedIn: "root"
	})
export class ThemeService
{
	/**
	 * Angular platform identifier for SSR checks.
	 * @type {Object}
	 * @private
	 */
	private platformId: Object =
		inject(PLATFORM_ID);

	/**
	 * Storage service for persisting theme preferences.
	 * @type {StorageService}
	 * @private
	 * @readonly
	 */
	private readonly storage: StorageService =
		inject(StorageService);

	/**
	 * Storage key for theme brightness.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly BRIGHTNESS_STORAGE_KEY: string = "seventysix-theme-brightness";

	/**
	 * Storage key for color scheme.
	 * @type {string}
	 * @private
	 * @readonly
	 */
	private readonly SCHEME_STORAGE_KEY: string = "seventysix-color-scheme";

	/**
	 * Current theme brightness (light/dark).
	 * @type {WritableSignal<ThemeBrightness>}
	 * @readonly
	 */
	brightness: WritableSignal<ThemeBrightness> =
		signal<ThemeBrightness>(
			this.getInitialBrightness());

	/**
	 * Current color scheme (blue/cyan-orange).
	 * @type {WritableSignal<ColorScheme>}
	 */
	colorScheme: WritableSignal<ColorScheme> =
		signal<ColorScheme>(
			this.getInitialColorScheme());

	/**
	 * Computed full theme name for display.
	 * @type {Signal<string>}
	 * @readonly
	 */
	themeName: Signal<string> =
		computed(
			() =>
			{
				const brightness: ThemeBrightness =
					this.brightness();
				const scheme: ColorScheme =
					this.colorScheme();
				return `${brightness}-${scheme}`;
			});

	constructor()
	{
		// Apply theme changes to document
		effect(
			() =>
			{
				this.applyTheme(this.brightness(), this.colorScheme());
			});
	}

	/**
	 * Toggle between light and dark brightness.
	 * @returns {void}
	 */
	toggleBrightness(): void
	{
		this.brightness.update(
			(current) =>
				current === "light" ? "dark" : "light");
	}

	/**
	 * Toggle between color schemes.
	 * @returns {void}
	 */
	toggleColorScheme(): void
	{
		this.colorScheme.update(
			(current) =>
				current === "blue" ? "cyan-orange" : "blue");
	}

	/**
	 * Set specific brightness.
	 * @param {ThemeBrightness} brightness
	 * The brightness value to set ('light' or 'dark').
	 * @returns {void}
	 */
	setBrightness(brightness: ThemeBrightness): void
	{
		this.brightness.set(brightness);
	}

	/**
	 * Set specific color scheme.
	 * @param {ColorScheme} scheme
	 * The color scheme to set (e.g., 'blue' or 'cyan-orange').
	 * @returns {void}
	 */
	setColorScheme(scheme: ColorScheme): void
	{
		this.colorScheme.set(scheme);
	}

	/**
	 * Get initial brightness from localStorage or default to light.
	 * @returns {ThemeBrightness}
	 * The initial brightness value ('light' or 'dark').
	 */
	private getInitialBrightness(): ThemeBrightness
	{
		const saved: string | null =
			this.storage.getItem<string>(
				this.BRIGHTNESS_STORAGE_KEY);
		return saved === "dark" || saved === "light" ? saved : "light";
	}

	/**
	 * Get initial color scheme from localStorage or default to blue.
	 * @returns {ColorScheme}
	 * The initial color scheme value (e.g., 'blue' or 'cyan-orange').
	 */
	private getInitialColorScheme(): ColorScheme
	{
		const savedScheme: string | null =
			this.storage.getItem<string>(
				this.SCHEME_STORAGE_KEY);
		// Default to cyan-orange unless user explicitly chose blue
		return savedScheme === "blue" ? "blue" : "cyan-orange";
	}

	/**
	 * Apply theme to document and save to localStorage.
	 * @param {ThemeBrightness} brightness
	 * The brightness to apply.
	 * @param {ColorScheme} scheme
	 * The color scheme to apply.
	 * @returns {void}
	 */
	private applyTheme(brightness: ThemeBrightness, scheme: ColorScheme): void
	{
		if (!isPlatformBrowser(this.platformId))
		{
			return;
		}

		const html: HTMLElement =
			document.documentElement;

		// Remove all theme classes
		html.classList.remove(
			"light-theme",
			"dark-theme",
			"blue-scheme",
			"cyan-orange-scheme");

		// Add current theme classes
		html.classList.add(`${brightness}-theme`);
		html.classList.add(`${scheme}-scheme`);

		// Save to storage
		this.storage.setItem(this.BRIGHTNESS_STORAGE_KEY, brightness);
		this.storage.setItem(this.SCHEME_STORAGE_KEY, scheme);
	}

	/**
	 * Check if current brightness is dark.
	 * @returns {boolean}
	 * True when the current brightness is dark.
	 */
	isDark(): boolean
	{
		return this.brightness() === "dark";
	}

	/**
	 * Check if current brightness is light.
	 * @returns {boolean}
	 * True when the current brightness is light.
	 */
	isLight(): boolean
	{
		return this.brightness() === "light";
	}

	/**
	 * Check if current scheme is blue.
	 * @returns {boolean}
	 * True when the color scheme is 'blue'.
	 */
	isBlue(): boolean
	{
		return this.colorScheme() === "blue";
	}

	/**
	 * Check if current scheme is cyan-orange.
	 * @returns {boolean}
	 * True when the color scheme is 'cyan-orange'.
	 */
	isCyanOrange(): boolean
	{
		return this.colorScheme() === "cyan-orange";
	}
}
