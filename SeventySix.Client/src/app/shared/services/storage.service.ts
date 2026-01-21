import { Injectable } from "@angular/core";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Storage abstraction service for localStorage and sessionStorage.
 * Provides typed access with JSON parsing and error handling.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class StorageService
{
	/**
	 * Get item from localStorage.
	 * Returns null if item doesn't exist.
	 * @param {string} key
	 * The storage key to retrieve.
	 * @returns {T | null}
	 * The parsed stored value as type T, or null if not present.
	 */
	getItem<T = string>(key: string): T | null
	{
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
	 * Set item in localStorage.
	 * Returns true on success, false on failure.
	 * @param {string} key
	 * The storage key to set.
	 * @param {T} value
	 * The value to store (will be stringified if not a string).
	 * @returns {boolean}
	 * True when the item was successfully written to storage.
	 */
	setItem<T>(key: string, value: T): boolean
	{
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
	 * Remove item from localStorage.
	 * @param {string} key
	 * The storage key to remove.
	 * @returns {void}
	 */
	removeItem(key: string): void
	{
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
	 * Clear all items from localStorage.
	 * @returns {void}
	 */
	clear(): void
	{
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

	// ========================================
	// SESSION STORAGE METHODS
	// ========================================

	/**
	 * Get item from sessionStorage.
	 * Returns null if item doesn't exist.
	 * @param {string} key
	 * The storage key to retrieve.
	 * @returns {TValue | null}
	 * The parsed stored value as type TValue, or null if not present.
	 */
	getSessionItem<TValue = string>(key: string): TValue | null
	{
		try
		{
			const value: string | null =
				sessionStorage.getItem(key);
			if (isNullOrUndefined(value))
			{
				return null;
			}

			// Try to parse as JSON, fallback to string
			try
			{
				return JSON.parse(value) as TValue;
			}
			catch
			{
				return value as TValue;
			}
		}
		catch (error)
		{
			console.error(
				`StorageService: Failed to get session "${key}"`,
				error);
			return null;
		}
	}

	/**
	 * Set item in sessionStorage.
	 * Returns true on success, false on failure.
	 * @param {string} key
	 * The storage key to set.
	 * @param {TValue} value
	 * The value to store (will be stringified if not a string).
	 * @returns {boolean}
	 * True when the item was successfully written to session storage.
	 */
	setSessionItem<TValue>(
		key: string,
		value: TValue): boolean
	{
		try
		{
			const stringValue: string =
				typeof value === "string" ? value : JSON.stringify(value);
			sessionStorage.setItem(key, stringValue);
			return true;
		}
		catch (error)
		{
			// Handle quota exceeded
			if (
				error instanceof DOMException
					&& error.name === "QuotaExceededError")
			{
				console.error("StorageService: Session quota exceeded");
			}
			console.error(
				`StorageService: Failed to set session "${key}"`,
				error);
			return false;
		}
	}

	/**
	 * Remove item from sessionStorage.
	 * @param {string} key
	 * The storage key to remove.
	 * @returns {void}
	 */
	removeSessionItem(key: string): void
	{
		try
		{
			sessionStorage.removeItem(key);
		}
		catch (error)
		{
			console.error(
				`StorageService: Failed to remove session "${key}"`,
				error);
		}
	}

	/**
	 * Clear all items from sessionStorage.
	 * @returns {void}
	 */
	clearSession(): void
	{
		try
		{
			sessionStorage.clear();
		}
		catch (error)
		{
			console.error(
				"StorageService: Failed to clear sessionStorage",
				error);
		}
	}
}
