// <copyright file="mfa-verification.utility.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { MFA_ERROR_CODE } from "@auth/constants";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * User-friendly error messages for MFA verification failures.
 */
const MFA_ERROR_MESSAGES: Readonly<Record<string, string>> =
	{
		[MFA_ERROR_CODE.INVALID_CODE]: "Invalid verification code. Please try again.",
		[MFA_ERROR_CODE.TOTP_INVALID_CODE]: "Invalid verification code. Please try again.",
		[MFA_ERROR_CODE.CODE_EXPIRED]: "Code has expired. Please request a new code.",
		[MFA_ERROR_CODE.TOO_MANY_ATTEMPTS]: "Too many attempts. Please request a new code.",
		[MFA_ERROR_CODE.TOTP_TOO_MANY_ATTEMPTS]: "Too many attempts. Please request a new code.",
		[MFA_ERROR_CODE.INVALID_CHALLENGE]: "Session expired. Please log in again.",
		[MFA_ERROR_CODE.CHALLENGE_USED]: "Session expired. Please log in again.",
		[MFA_ERROR_CODE.TOTP_NOT_ENABLED]: "Authenticator app is not set up. Please log in again."
	};

/**
 * User-friendly error messages for backup code verification failures.
 */
const BACKUP_CODE_ERROR_MESSAGES: Readonly<Record<string, string>> =
	{
		[MFA_ERROR_CODE.BACKUP_CODE_INVALID]: "Invalid backup code. Please try again.",
		[MFA_ERROR_CODE.BACKUP_CODE_ALREADY_USED]: "This backup code has already been used.",
		[MFA_ERROR_CODE.NO_BACKUP_CODES_AVAILABLE]: "No backup codes available. Please contact support."
	};

/**
 * Error codes that require redirecting to login page.
 */
const LOGIN_REDIRECT_ERROR_CODES: ReadonlySet<string> =
	new Set(
		[
			MFA_ERROR_CODE.TOO_MANY_ATTEMPTS,
			MFA_ERROR_CODE.TOTP_TOO_MANY_ATTEMPTS,
			MFA_ERROR_CODE.INVALID_CHALLENGE,
			MFA_ERROR_CODE.CHALLENGE_USED,
			MFA_ERROR_CODE.TOTP_NOT_ENABLED
		]);

/**
 * Gets the user-friendly error message for an MFA verification error.
 *
 * @param errorCode
 * The error code from the server response.
 *
 * @param fallbackMessage
 * Message to use when error code is not recognized.
 *
 * @returns
 * User-friendly error message for display.
 */
export function getMfaErrorMessage(
	errorCode: string | undefined,
	fallbackMessage: string): string
{
	if (isNullOrUndefined(errorCode))
	{
		return fallbackMessage;
	}

	return MFA_ERROR_MESSAGES[errorCode] ?? fallbackMessage;
}

/**
 * Gets the user-friendly error message for a backup code verification error.
 *
 * @param errorCode
 * The error code from the server response.
 *
 * @param fallbackMessage
 * Message to use when error code is not recognized.
 *
 * @returns
 * User-friendly error message for display.
 */
export function getBackupCodeErrorMessage(
	errorCode: string | undefined,
	fallbackMessage: string): string
{
	if (isNullOrUndefined(errorCode))
	{
		return fallbackMessage;
	}

	return BACKUP_CODE_ERROR_MESSAGES[errorCode] ?? fallbackMessage;
}

/**
 * Determines if the error requires redirecting to login page.
 *
 * @param errorCode
 * The error code from the server response.
 *
 * @returns
 * True if the user should be redirected to login.
 */
export function requiresLoginRedirect(errorCode: string | undefined): boolean
{
	if (isNullOrUndefined(errorCode))
	{
		return false;
	}

	return LOGIN_REDIRECT_ERROR_CODES.has(errorCode);
}
