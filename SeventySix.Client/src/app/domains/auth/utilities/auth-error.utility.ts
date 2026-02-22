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

			case AUTH_ERROR_CODE.BREACHED_PASSWORD:
				return {
					message: "This password has been found in a data breach. Please choose a different password.",
					invalidateToken: false
				};

			case AUTH_ERROR_CODE.INVALID_CREDENTIALS:
				return {
					message: "Invalid username or password.",
					invalidateToken: false
				};

			case AUTH_ERROR_CODE.ACCOUNT_LOCKED:
				return {
					message: "Your account has been locked. Please try again later.",
					invalidateToken: false
				};

			case AUTH_ERROR_CODE.ACCOUNT_INACTIVE:
				return {
					message: "Your account is inactive. Please contact support.",
					invalidateToken: false
				};

			case AUTH_ERROR_CODE.WEAK_PASSWORD:
				return {
					message: "This password does not meet the requirements. Please choose a stronger password.",
					invalidateToken: false
				};

			case AUTH_ERROR_CODE.REGISTRATION_FAILED:
				return {
					message: "Registration could not be completed. Please try again.",
					invalidateToken: true
				};

			case AUTH_ERROR_CODE.INVALID_PASSWORD_RESET_TOKEN:
			case AUTH_ERROR_CODE.INVALID_EMAIL_VERIFICATION_TOKEN:
				return {
					message: "This link has expired or is invalid. Please request a new one.",
					invalidateToken: true
				};

			case AUTH_ERROR_CODE.EMAIL_NOT_CONFIRMED:
				return {
					message: "Please verify your email address before signing in.",
					invalidateToken: false
				};

			default:
				return {
					message: "Invalid request. Please check your input.",
					invalidateToken: false
				};
		}
	}

	return {
		message: "An unexpected error occurred. Please try again.",
		invalidateToken: false
	};
}