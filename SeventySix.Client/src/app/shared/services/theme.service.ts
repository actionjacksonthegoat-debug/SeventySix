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
import { STORAGE_KEYS } from "@shared/constants";
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
	 * Initialize theme on application startup.
	 * Called by APP_INITIALIZER to ensure theme is applied before render.
	 * Theme is automatically applied via effect() in constructor - this method
	 * exists for explicit initialization contract and future extensibility.
	 * @returns {void}
	 */
	initialize(): void
	{
		// Theme is applied via effect() in constructor on signal read.
		// This explicit method satisfies the APP_INITIALIZER contract.
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
	 * Get initial brightness from localStorage or default to dark.
	 * @returns {ThemeBrightness}
	 * The initial brightness value ('light' or 'dark').
	 */
	private getInitialBrightness(): ThemeBrightness
	{
		const saved: string | null =
			this.storage.getItem<string>(
				STORAGE_KEYS.THEME_BRIGHTNESS);
		return saved === "dark" || saved === "light" ? saved : "dark";
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
				STORAGE_KEYS.THEME_COLOR_SCHEME);
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
		this.storage.setItem(STORAGE_KEYS.THEME_BRIGHTNESS, brightness);
		this.storage.setItem(STORAGE_KEYS.THEME_COLOR_SCHEME, scheme);
	}

	/**
	 * Whether current brightness is dark.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isDark: Signal<boolean> =
		computed(
			() => this.brightness() === "dark");

	/**
	 * Whether current brightness is light.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isLight: Signal<boolean> =
		computed(
			() => this.brightness() === "light");

	/**
	 * Whether current scheme is blue.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isBlue: Signal<boolean> =
		computed(
			() => this.colorScheme() === "blue");

	/**
	 * Whether current scheme is cyan-orange.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isCyanOrange: Signal<boolean> =
		computed(
			() =>
				this.colorScheme() === "cyan-orange");
}