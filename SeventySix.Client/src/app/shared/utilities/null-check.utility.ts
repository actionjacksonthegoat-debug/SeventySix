/**
 * Type guard to check if a value is null or undefined.
 * Use instead of truthy checks (!value) which incorrectly catch empty strings, zero, and false.
 *
 * @param {unknown} value
 * The value to check.
 *
 * @returns {value is null | undefined}
 * True if the value is null or undefined, false otherwise.
 *
 * @example
 * ```typescript
 * const name: string | null = getUsername();
 * if (isNullOrUndefined(name))
 * {
 *   console.log("No username provided");
 *   return;
 * }
 * // TypeScript knows name is string here
 * console.log(name.toUpperCase());
 * ```
 */
export function isNullOrUndefined(
	value: unknown): value is null | undefined
{
	return value === null || value === undefined;
}

/**
 * Type guard to check if a value is present (not null or undefined).
 * Opposite of isNullOrUndefined. Allows empty strings, zero, and false.
 *
 * @param {T | null | undefined} value
 * The value to check.
 *
 * @returns {value is T}
 * True if the value is not null or undefined, false otherwise.
 *
 * @example
 * ```typescript
 * const count: number | null = getCount();
 * if (isPresent(count))
 * {
 *   // TypeScript knows count is number here (could be 0)
 *   console.log(`Count: ${count}`);
 * }
 * ```
 */
export function isPresent<T>(
	value: T | null | undefined): value is T
{
	return !isNullOrUndefined(value);
}

/**
 * Checks if a string is null, undefined, or empty.
 * Does NOT trim whitespace - use explicit .trim() if needed.
 *
 * @param {string | null | undefined} value
 * The string value to check.
 *
 * @returns {value is null | undefined | ""}
 * True if the value is null, undefined, or an empty string.
 *
 * @example
 * ```typescript
 * const username: string | null = form.get("username")?.value;
 * if (isNullOrEmpty(username))
 * {
 *   return "Username is required";
 * }
 * // TypeScript knows username is string here (but could be whitespace)
 * ```
 */
export function isNullOrEmpty(
	value: string | null | undefined): value is null | undefined | ""
{
	return isNullOrUndefined(value) || value === "";
}

/**
 * Checks if a string is null, undefined, empty, or contains only whitespace.
 * Trims the string before checking - perfect for form validation where " " should be invalid.
 *
 * @param {string | null | undefined} value
 * The string value to check.
 *
 * @returns {value is null | undefined | ""}
 * True if the value is null, undefined, empty, or whitespace-only.
 *
 * @example
 * ```typescript
 * const username: string | null = form.get("username")?.value;
 * if (isNullOrWhitespace(username))
 * {
 *   return "Username is required";
 * }
 * // TypeScript knows username is string here (and has non-whitespace content)
 * ```
 */
export function isNullOrWhitespace(
	value: string | null | undefined): value is null | undefined | ""
{
	return isNullOrUndefined(value) || value.trim() === "";
}

/**
 * Type guard to check if a value is a non-null, non-array object.
 * Filters out null, undefined, primitives, and arrays.
 *
 * @param {unknown} value
 * The value to check.
 *
 * @returns {value is Record<string, unknown>}
 * True if the value is a non-null object (not an array), false otherwise.
 *
 * @example
 * ```typescript
 * const error: unknown = getApiError();
 * if (isNonNullObject(error) && "message" in error)
 * {
 *   // TypeScript knows error is Record<string, unknown> here
 *   console.error(error.message);
 * }
 * ```
 */
export function isNonNullObject(
	value: unknown): value is Record<string, unknown>
{
	return typeof value === "object"
		&& value !== null
		&& !Array.isArray(value);
}