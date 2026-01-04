/**
 * Model representing the result of mapping auth-related HTTP errors.
 * Placed in shared models so it can be reused across domains.
 */
export interface AuthErrorResult
{
	/**
	 * User-facing error message.
	 * @type {string}
	 */
	message: string;

	/**
	 * Whether the token should be invalidated (e.g., expired token).
	 * @type {boolean}
	 */
	invalidateToken: boolean;
}
