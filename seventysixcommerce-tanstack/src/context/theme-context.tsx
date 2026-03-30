import { createContext, use } from "react";
import type { JSX, ReactNode } from "react";
import type { ThemeState } from "~/hooks/use-theme";
import { useTheme } from "~/hooks/use-theme";

/** React context for sharing theme state across the component tree. */
const ThemeContext: React.Context<ThemeState | null> =
	createContext<ThemeState | null>(null);

/** Props for the ThemeProvider component. */
interface ThemeProviderProps
{
	/** The child components to wrap with theme context. */
	children: ReactNode;
}

/** Provides theme state to all child components via React context. */
export function ThemeProvider({ children }: Readonly<ThemeProviderProps>): JSX.Element
{
	const themeState: ThemeState =
		useTheme();

	return (
		<ThemeContext value={themeState}>
			{children}
		</ThemeContext>);
}

/**
 * Consumes the theme context.
 * Must be used within a ThemeProvider.
 * @throws Error if used outside of ThemeProvider
 */
export function useThemeContext(): ThemeState
{
	const context: ThemeState | null =
		use(ThemeContext);

	if (context === null)
	{
		throw new Error("useThemeContext must be used within a ThemeProvider");
	}

	return context;
}