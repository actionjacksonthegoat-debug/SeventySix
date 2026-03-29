/** The localStorage key used to persist the theme preference. */
const STORAGE_KEY: string = "SeventySixCommerce-theme";

/** Valid theme values. */
type Theme = "light" | "dark";

/** Reactive theme state using Svelte 5 compatible patterns. */
interface ThemeState
{
	/** The current theme value. */
	current: Theme;
	/** Whether the current theme is dark. */
	isDark: boolean;
}

/** The reactive theme state object. */
export const theme: ThemeState =
	{
		current: "light",
		get isDark(): boolean
		{
			return this.current === "dark";
		}
	};

/** Applies the current theme by toggling the `dark` class on `<html>`. */
function applyTheme(value: Theme): void
{
	if (typeof document !== "undefined")
	{
		if (value === "dark")
		{
			document.documentElement.classList.add("dark");
		}
		else
		{
			document.documentElement.classList.remove("dark");
		}
	}
}

/**
 * Initializes the theme from localStorage or prefers-color-scheme.
 * Call this once on app startup (e.g., in the root layout's onMount).
 */
export function initTheme(): void
{
	let stored: string | null = null;

	if (typeof localStorage !== "undefined")
	{
		stored =
			localStorage.getItem(STORAGE_KEY);
	}

	if (stored === "dark" || stored === "light")
	{
		theme.current = stored;
	}
	else if (
		typeof window !== "undefined"
			&& window.matchMedia("(prefers-color-scheme: dark)").matches)
	{
		theme.current = "dark";
	}
	else
	{
		theme.current = "light";
	}

	applyTheme(theme.current);
}

/** Sets the theme to a specific value and persists it. */
export function setTheme(value: Theme): void
{
	theme.current = value;
	applyTheme(value);

	if (typeof localStorage !== "undefined")
	{
		localStorage.setItem(STORAGE_KEY, value);
	}
}

/** Toggles between light and dark mode. */
export function toggleTheme(): void
{
	const next: Theme =
		theme.current === "light" ? "dark" : "light";
	setTheme(next);
}