/**
 * Validation result model used by auth validation utilities.
 */
export interface ValidationResult
{
	/**
	 * Whether the validation passed.
	 * @type {boolean}
	 */
	valid: boolean;

	/**
	 * Error message when validation fails.
	 * @type {string | undefined}
	 */
	errorMessage?: string;
}
