/**
 * Mutation Error Utility
 * Centralized, secure error message extraction for TanStack mutation onError callbacks.
 * Eliminates raw error.message exposure to end users.
 */

import { HttpErrorResponse } from "@angular/common/http";
import { HTTP_STATUS } from "@shared/constants";
import { isPresent } from "@shared/utilities/null-check.utility";

/**
 * Default user-facing fallback message. Never exposes server internals.
 */
const DEFAULT_FALLBACK: string = "An unexpected error occurred. Please try again.";

/**
 * Strips CR and LF characters from a string to prevent log injection and display issues.
 *
 * @param {string} value
 * The string to sanitize.
 * @returns {string}
 * The string with carriage return and newline characters removed.
 */
function stripControlCharacters(value: string): string
{
	return value.replace(/[\r\n]/g, "");
}

/**
 * Extracts a safe, user-displayable error message from a TanStack mutation `onError` argument.
 *
 * @remarks
 * Security rules enforced:
 * - 4xx responses: returns `detail` from ProblemDetails body (safe per server contract).
 * - 5xx / network errors: returns the fallback — raw server detail is never displayed.
 * - Unknown / non-HTTP errors: returns the fallback.
 * - CR/LF characters are stripped from any displayed text (defense-in-depth).
 *
 * @param {unknown} error
 * The mutation error (typically `HttpErrorResponse | Error | unknown`).
 * @param {string} fallback
 * Optional override for the generic fallback message shown on unsafe or unknown errors.
 * @returns {string}
 * A safe, user-displayable string.
 */
export function getMutationErrorMessage(
	error: unknown,
	fallback: string = DEFAULT_FALLBACK): string
{
	if (!(error instanceof HttpErrorResponse))
	{
		return fallback;
	}

	const status: number =
		error.status;
	const isClientError: boolean =
		status >= HTTP_STATUS.BAD_REQUEST
			&& status < HTTP_STATUS.INTERNAL_SERVER_ERROR;

	if (isClientError)
	{
		const detail: string | undefined =
			error.error?.detail as string | undefined;

		if (isPresent(detail))
		{
			return stripControlCharacters(detail);
		}
	}

	return fallback;
}