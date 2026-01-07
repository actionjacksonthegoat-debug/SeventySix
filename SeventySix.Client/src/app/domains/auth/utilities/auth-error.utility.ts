/**
 * Auth Error Utility
 * Centralized error handling for auth domain
 * Eliminates duplicated getErrorMessage() logic across auth pages
 */

import { HttpErrorResponse } from "@angular/common/http";
import { AUTH_ERROR_CODE } from "@auth/constants";
import { HTTP_STATUS } from "@shared/constants";
import { AuthErrorResult } from "@shared/models";

/**
 * Maps HTTP error responses to user-friendly auth error messages.
 * Centralizes error handling logic previously duplicated across auth pages.
 * @param {HttpErrorResponse} error
 * HTTP error response from auth API.
 * @returns {AuthErrorResult}
 * Error result with user message and token invalidation flag.
 */
export function mapAuthError(error: HttpErrorResponse): AuthErrorResult
{
	if (error.status === HTTP_STATUS.BAD_REQUEST)
	{
		const errorCode: string =
			error.error?.extensions?.errorCode;

		switch (errorCode)
		{
			case AUTH_ERROR_CODE.INVALID_TOKEN:
			case AUTH_ERROR_CODE.TOKEN_EXPIRED:
				return {
					message: "This link has expired. Please request a new one.",
					invalidateToken: true
				};

			case AUTH_ERROR_CODE.USERNAME_EXISTS:
				return {
					message: "This username is already taken. Please choose another.",
					invalidateToken: false
				};

			default:
				return {
					message:
						error.error?.detail
							?? "Invalid request. Please check your input.",
					invalidateToken: false
				};
		}
	}

	return {
		message: "An unexpected error occurred. Please try again.",
		invalidateToken: false
	};
}
