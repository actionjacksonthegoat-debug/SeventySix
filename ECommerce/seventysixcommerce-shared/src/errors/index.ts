/**
 * Shared commerce error types.
 * Provides a structured error class with HTTP status codes
 * that both frameworks can map to their response patterns.
 */

/** Commerce operation error with user-safe message and HTTP status code. */
export class CommerceError extends Error
{
	/** HTTP status code for the error response. */
	readonly statusCode: number;

	/**
	 * Creates a new CommerceError.
	 * @param message - User-safe error message.
	 * @param statusCode - HTTP status code (defaults to 400).
	 */
	constructor(message: string, statusCode: number = 400)
	{
		super(message);
		this.name = "CommerceError";
		this.statusCode = statusCode;
	}
}

/**
 * Creates a user-safe error for an empty cart during checkout.
 * @returns {CommerceError} A 400 error with "Cart is empty" message.
 */
export function cartEmptyError(): CommerceError
{
	return new CommerceError("Cart is empty", 400);
}

/**
 * Creates a user-safe error for unavailable products.
 * @param productNames - Names of the unavailable products.
 * @returns {CommerceError} A 400 error listing the unavailable items.
 */
export function itemsUnavailableError(productNames: string[]): CommerceError
{
	const names: string =
		productNames.join(", ");
	return new CommerceError(
		`The following items are no longer available: ${names}`,
		400);
}

/**
 * Creates a user-safe error for checkout session creation failure.
 * @returns {CommerceError} A 500 error for checkout failure.
 */
export function checkoutFailedError(): CommerceError
{
	return new CommerceError(
		"Failed to create checkout session",
		500);
}

/**
 * Type guard to check if an error is a CommerceError.
 * @param error - The error to check.
 * @returns {boolean} True if the error is a CommerceError.
 */
export function isCommerceError(error: unknown): error is CommerceError
{
	return error instanceof CommerceError;
}