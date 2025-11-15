import { signal } from "@angular/core";
import { ThemeBrightness, ColorScheme } from "@core/services/theme.service";

/**
 * Mock ThemeService for testing
 * Provides a comprehensive mock with all ThemeService methods
 * Use this in test specs instead of creating individual mocks
 *
 * Usage in tests:
 * ```typescript
 * const mockThemeService = createMockThemeService();
 * // Then use jasmine.createSpyObj to wrap it if needed
 * ```
 */
export class MockThemeService
{
	brightness: WritableSignal<ThemeBrightness> =
		signal<ThemeBrightness>("light");
	colorScheme: WritableSignal<ColorScheme> = signal<ColorScheme>("blue");

	toggleBrightness(): void
	{
		this.brightness.update((current) =>
			current === "light" ? "dark" : "light"
		);
	}

	toggleColorScheme(): void
	{
		this.colorScheme.update((current) =>
			current === "blue" ? "cyan-orange" : "blue"
		);
	}

	setBrightness(brightness: ThemeBrightness): void
	{
		this.brightness.set(brightness);
	}

	setColorScheme(scheme: ColorScheme): void
	{
		this.colorScheme.set(scheme);
	}

	isDark(): boolean
	{
		return this.brightness() === "dark";
	}

	isLight(): boolean
	{
		return this.brightness() === "light";
	}

	isBlue(): boolean
	{
		return this.colorScheme() === "blue";
	}

	isCyanOrange(): boolean
	{
		return this.colorScheme() === "cyan-orange";
	}

	themeName(): string
	{
		return `${this.brightness()}-${this.colorScheme()}`;
	}
}

/**
 * Factory function to create a new MockThemeService instance
 * Use this in your test's beforeEach
 */
export function createMockThemeService(): MockThemeService
{
	return new MockThemeService();
}
