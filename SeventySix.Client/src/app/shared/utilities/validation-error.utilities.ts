import { AbstractControl } from "@angular/forms";
import {
	VALIDATION_ERROR_MESSAGES,
	ValidationMessageTemplate
} from "@shared/constants/validation-error.constants";
import { isNonNullObject } from "@shared/utilities/null-check.utility";

/**
 * Gets the first validation error message for a form control.
 * Returns null if control is valid or has no errors.
 *
 * @param control - The form control to check for errors
 * @param fieldLabel - The human-readable label for the field (e.g., "Email", "Username")
 * @returns The error message string, or null if no errors
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
