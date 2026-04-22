/**
 * Type guard to check if a value is null or undefined.
 * Use instead of truthy checks (=== null, === undefined) which must never appear inline.
 *
 * @param {unknown} value
 * The value to check.
 *
 * @returns {value is null | undefined}
 * True if the value is null or undefined, false otherwise.
 *
 * @example
 * ```typescript
 * const secret: string | undefined = process.env.STRIPE_SECRET_KEY;
 * if (isNullOrUndefined(secret))
 * {
 *   throw new Error("Secret is not configured");
 * }
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
 * const sdk: NodeSDK | undefined = getSDK();
 * if (isPresent(sdk))
 * {
 *   await sdk.shutdown();
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
 * Does NOT trim whitespace — use explicit .trim() if needed.
 *
 * @param {string | null | undefined} value
 * The string value to check.
 *
 * @returns {value is null | undefined | ""}
 * True if the value is null, undefined, or an empty string.
 *
 * @example
 * ```typescript
 * const secret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET;
 * if (isNullOrEmpty(secret))
 * {
 *   throw new Error("Webhook secret is not configured");
 * }
 * ```
 */
export function isNullOrEmpty(
	value: string | null | undefined): value is null | undefined | ""
{
	return isNullOrUndefined(value) || value === "";
}