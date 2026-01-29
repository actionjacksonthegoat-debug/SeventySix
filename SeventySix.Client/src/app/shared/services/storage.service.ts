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
	 * Executes a storage operation with standardized error handling.
	 *
	 * @param {() => T} operation
	 * The storage operation to execute.
	 *
	 * @param {string} errorContext
	 * Context description for error logging.
	 *
	 * @param {T} fallbackValue
	 * Value to return if operation fails.
	 *
	 * @returns {T}
	 * The operation result or fallback value.
	 */
	private executeStorageOperation<T>(
		operation: () => T,
		errorContext: string,
		fallbackValue: T): T
	{
		try
		{
			return operation();
		}
		catch (error: unknown)
		{
			console.error(
				`StorageService: ${errorContext}`,
				error);
			return fallbackValue;
		}
	}

	/**
	 * Parses a storage value, attempting JSON parse with string fallback.
	 *
	 * @param {string | null} value
	 * The raw string value from storage.
	 *
	 * @returns {T | null}
	 * The parsed value or null if not present.
	 */
	private parseStorageValue<T>(value: string | null): T | null
	{
		if (isNullOrUndefined(value))
		{
			return null;
		}

		try
		{
			return JSON.parse(value) as T;
		}
		catch
		{
			return value as T;
		}
	}

	/**
	 * Stringifies a value for storage.
	 *
	 * @param {T} value
	 * The value to stringify.
	 *
	 * @returns {string}
	 * The stringified value.
	 */
	private stringifyValue<T>(value: T): string
	{
		return typeof value === "string" ? value : JSON.stringify(value);
	}

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
		return this.executeStorageOperation(
			() =>
				this.parseStorageValue<T>(localStorage.getItem(key)),
			`Failed to get "${key}"`,
			null);
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
		return this.executeStorageOperation(
			() =>
			{
				localStorage.setItem(
					key,
					this.stringifyValue(value));
				return true;
			},
			`Failed to set "${key}"`,
			false);
	}

	/**
	 * Remove item from localStorage.
	 * @param {string} key
	 * The storage key to remove.
	 * @returns {void}
	 */
	removeItem(key: string): void
	{
		this.executeStorageOperation(
			() =>
			{
				localStorage.removeItem(key);
				return undefined;
			},
			`Failed to remove "${key}"`,
			undefined);
	}

	/**
	 * Clear all items from localStorage.
	 * @returns {void}
	 */
	clear(): void
	{
		this.executeStorageOperation(
			() =>
			{
				localStorage.clear();
				return undefined;
			},
			"Failed to clear localStorage",
			undefined);
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
		return this.executeStorageOperation(
			() =>
				this.parseStorageValue<TValue>(sessionStorage.getItem(key)),
			`Failed to get session "${key}"`,
			null);
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
		return this.executeStorageOperation(
			() =>
			{
				sessionStorage.setItem(
					key,
					this.stringifyValue(value));
				return true;
			},
			`Failed to set session "${key}"`,
			false);
	}

	/**
	 * Remove item from sessionStorage.
	 * @param {string} key
	 * The storage key to remove.
	 * @returns {void}
	 */
	removeSessionItem(key: string): void
	{
		this.executeStorageOperation(
			() =>
			{
				sessionStorage.removeItem(key);
				return undefined;
			},
			`Failed to remove session "${key}"`,
			undefined);
	}

	/**
	 * Clear all items from sessionStorage.
	 * @returns {void}
	 */
	clearSession(): void
	{
		this.executeStorageOperation(
			() =>
			{
				sessionStorage.clear();
				return undefined;
			},
			"Failed to clear sessionStorage",
			undefined);
	}
}
