import { HttpErrorResponse } from "@angular/common/http";
import { isNonNullObject, isPresent } from "./null-check.utility";

/**
 * Extracts validation errors from ASP.NET Core error response.
 * Returns array of field-level error messages.
 */
export function extractValidationErrors(
	error: HttpErrorResponse
): string[]
{
	const errors: string[] = [];

	if (!isNonNullObject(error.error?.errors))
	{
		return errors;
	}

	for (const [field, messages] of Object.entries(error.error.errors))
	{
		if (Array.isArray(messages))
		{
			messages.forEach(
				(message: string) =>
					errors.push(`${field}: ${message}`)
			);
		}
	}

	return errors;
}

/**
 * Extracts HTTP status details for error messages.
 */
export function extractHttpStatus(
	error: HttpErrorResponse
): string | null
{
	return error.status > 0
		? `Status: ${error.status} ${error.statusText}`
		: null;
}

/**
 * Extracts error title if different from user message.
 */
export function extractErrorTitle(
	error: HttpErrorResponse,
	userMessage: string
): string | null
{
	const title: string | undefined = error.error?.title;
	return isPresent(title) && title !== userMessage ? title : null;
}
