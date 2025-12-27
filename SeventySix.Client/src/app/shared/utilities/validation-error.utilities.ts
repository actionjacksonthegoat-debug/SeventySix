import { AbstractControl } from "@angular/forms";
import {
	VALIDATION_ERROR_MESSAGES,
	ValidationMessageTemplate
} from "@shared/constants/validation-error.constants";
import { isNonNullObject } from "@shared/utilities/null-check.utility";

/**
 * Gets the first validation error message for a form control.
 * Returns `null` when the control has no errors or is not provided.
 *
 * @param {AbstractControl | null | undefined} control
 * The form control to check for errors.
 *
 * @param {string} fieldLabel
 * The human-readable label for the field (for example, "Email" or "Username").
 *
 * @returns {string | null}
 * The error message string for the first validation error, or `null` when there are no errors.
 *
 * @example
 * ```typescript
 * const emailControl = new FormControl('', Validators.required);
 * const error = getValidationError(emailControl, 'Email');
 * // Returns: "Email is required"
 * ```
 */
export function getValidationError(
	control: AbstractControl | null | undefined,
	fieldLabel: string): string | null
{
	if (!control?.errors)
	{
		return null;
	}

	const errorKeys: string[] =
		Object.keys(control.errors);
	if (errorKeys.length === 0)
	{
		return null;
	}

	const firstErrorKey: string =
		errorKeys[0];
	const errorValue: unknown =
		control.errors[firstErrorKey];
	const messageTemplate: ValidationMessageTemplate | undefined =
		VALIDATION_ERROR_MESSAGES[firstErrorKey];

	if (!messageTemplate)
	{
		// Fallback for custom validators with message property
		if (isNonNullObject(errorValue) && "message" in errorValue)
		{
			return (errorValue as { message: string; }).message;
		}
		return `${fieldLabel} is invalid`;
	}

	if (typeof messageTemplate === "function")
	{
		const params: Record<string, unknown> =
			isNonNullObject(errorValue)
				? errorValue
				: {};
		return messageTemplate(params)
		.replace("{field}", fieldLabel);
	}

	return messageTemplate.replace("{field}", fieldLabel);
}
