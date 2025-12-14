import { isPlatformBrowser } from "@angular/common";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isNullOrUndefined } from "@infrastructure/utils/null-check.utility";

/**
 * Storage abstraction service using Angular best practices.
 * SSR-safe localStorage wrapper with minimal abstraction (KISS principle).
 * Based on official Angular SSR documentation pattern.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class StorageService
{
	private readonly platformId: object =
		inject(PLATFORM_ID);
	private readonly isBrowser: boolean =
		isPlatformBrowser(this.platformId);

	/**
	 * Get item from localStorage (SSR-safe).
	 * Returns null if not in browser or item doesn't exist.
	 */
	getItem<T = string>(key: string): T | null
	{
		if (!this.isBrowser)
		{
			return null;
		}

		try
		{
			const value: string | null =
				localStorage.getItem(key);
			if (isNullOrUndefined(value))
			{
				return null;
			}

			// Try to parse as JSON, fallback to string
			try
			{
				return JSON.parse(value) as T;
			}
			catch
			{
				return value as T;
			}
		}
		catch (error)
		{
			console.error(`StorageService: Failed to get "${key}"`, error);
			return null;
		}
	}

	/**
	 * Set item in localStorage (SSR-safe).
	 * Returns true on success, false on failure.
	 */
	setItem<T>(key: string, value: T): boolean
	{
		if (!this.isBrowser)
		{
			return false;
		}

		try
		{
			const stringValue: string =
				typeof value === "string" ? value : JSON.stringify(value);
			localStorage.setItem(key, stringValue);
			return true;
		}
		catch (error)
		{
			// Handle quota exceeded
			if (
				error instanceof DOMException
					&& error.name === "QuotaExceededError")
			{
				console.error("StorageService: Quota exceeded");
			}
			console.error(`StorageService: Failed to set "${key}"`, error);
			return false;
		}
	}

	/**
	 * Remove item from localStorage (SSR-safe).
	 */
	removeItem(key: string): void
	{
		if (!this.isBrowser)
		{
			return;
		}
		try
		{
			localStorage.removeItem(key);
		}
		catch (error)
		{
			console.error(`StorageService: Failed to remove "${key}"`, error);
		}
	}

	/**
	 * Clear all items from localStorage (SSR-safe).
	 */
	clear(): void
	{
		if (!this.isBrowser)
		{
			return;
		}
		try
		{
			localStorage.clear();
		}
		catch (error)
		{
			console.error(
				"StorageService: Failed to clear localStorage",
				error);
		}
	}
}
