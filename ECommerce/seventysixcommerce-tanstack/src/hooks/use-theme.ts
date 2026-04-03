import { useCallback, useEffect, useMemo, useState } from "react";

/** The localStorage key used to persist the theme preference. */
const STORAGE_KEY: string = "SeventySixCommerce-theme";

/** Valid theme values. */
export type Theme = "light" | "dark";

/** The return type of the useTheme hook. */
export interface ThemeState
{
	/** The current theme value. */
	theme: Theme;
	/** Whether the current theme is dark. */
	isDark: boolean;
	/** Toggles between light and dark theme. */
	toggleTheme: () => void;
	/** Sets the theme to a specific value. */
	setTheme: (value: Theme) => void;
}

/** Reads the initial theme from localStorage or prefers-color-scheme. Falls back to "light" on SSR. */
function getInitialTheme(): Theme
{
	if (typeof window === "undefined")
	{
		return "light";
	}

	const stored: string | null =
		localStorage.getItem(STORAGE_KEY);

	if (stored === "dark" || stored === "light")
	{
		return stored;
	}

	if (window.matchMedia("(prefers-color-scheme: dark)").matches)
	{
		return "dark";
	}

	return "light";
}

/** Applies the theme by toggling the `dark` class on the document root element. */
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
 * React hook for managing theme state with localStorage persistence.
 * SSR-safe — guards all browser API access.
 */
export function useTheme(): ThemeState
{
	const [theme, setThemeState] =
		useState<Theme>(getInitialTheme);

	useEffect(
		() =>
		{
			applyTheme(theme);
		},
		[theme]);

	const setTheme: (value: Theme) => void =
		useCallback(
			(value: Theme): void =>
			{
				setThemeState(value);
				applyTheme(value);

				if (typeof localStorage !== "undefined")
				{
					localStorage.setItem(STORAGE_KEY, value);
				}
			},
			[]);

	const toggleTheme: () => void =
		useCallback(
			(): void =>
			{
				setThemeState(
					(prev: Theme): Theme =>
					{
						const next: Theme =
							prev === "light" ? "dark" : "light";
						applyTheme(next);

						if (typeof localStorage !== "undefined")
						{
							localStorage.setItem(STORAGE_KEY, next);
						}

						return next;
					});
			},
			[]);

	const isDark: boolean =
		useMemo(
			() => theme === "dark",
			[theme]);

	return { theme, isDark, toggleTheme, setTheme };
}