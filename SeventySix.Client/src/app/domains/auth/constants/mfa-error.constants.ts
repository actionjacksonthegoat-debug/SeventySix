// <copyright file="mfa-error.constant.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * MFA error codes returned from the server.
 * Keep in sync with server-side error codes from Identity domain.
 */
export const MFA_ERROR_CODE: Readonly<{
	INVALID_CODE: "MFA_INVALID_CODE";
	TOTP_INVALID_CODE: "TOTP_INVALID_CODE";
	CODE_EXPIRED: "MFA_CODE_EXPIRED";
	TOO_MANY_ATTEMPTS: "MFA_TOO_MANY_ATTEMPTS";
	TOTP_TOO_MANY_ATTEMPTS: "TOTP_TOO_MANY_ATTEMPTS";
	INVALID_CHALLENGE: "MFA_INVALID_CHALLENGE";
	CHALLENGE_USED: "MFA_CHALLENGE_USED";
	TOTP_NOT_ENABLED: "TOTP_NOT_ENABLED";
	BACKUP_CODE_INVALID: "BACKUP_CODE_INVALID";
	BACKUP_CODE_ALREADY_USED: "BACKUP_CODE_ALREADY_USED";
	NO_BACKUP_CODES_AVAILABLE: "NO_BACKUP_CODES_AVAILABLE";
}> =
	{
		/** Invalid MFA verification code. */
		INVALID_CODE: "MFA_INVALID_CODE",
		/** Invalid TOTP verification code. */
		TOTP_INVALID_CODE: "TOTP_INVALID_CODE",
		/** MFA code has expired. */
		CODE_EXPIRED: "MFA_CODE_EXPIRED",
		/** Too many MFA verification attempts. */
		TOO_MANY_ATTEMPTS: "MFA_TOO_MANY_ATTEMPTS",
		/** Too many TOTP verification attempts. */
		TOTP_TOO_MANY_ATTEMPTS: "TOTP_TOO_MANY_ATTEMPTS",
		/** MFA challenge is invalid. */
		INVALID_CHALLENGE: "MFA_INVALID_CHALLENGE",
		/** MFA challenge has already been used. */
		CHALLENGE_USED: "MFA_CHALLENGE_USED",
		/** TOTP authentication is not enabled. */
		TOTP_NOT_ENABLED: "TOTP_NOT_ENABLED",
		/** Backup code is invalid. */
		BACKUP_CODE_INVALID: "BACKUP_CODE_INVALID",
		/** Backup code has already been used. */
		BACKUP_CODE_ALREADY_USED: "BACKUP_CODE_ALREADY_USED",
		/** No backup codes are available. */
		NO_BACKUP_CODES_AVAILABLE: "NO_BACKUP_CODES_AVAILABLE"
	} as const;

/**
 * MFA error code type for type-safe comparisons.
 */
export type MfaErrorCode =
	typeof MFA_ERROR_CODE[keyof typeof MFA_ERROR_CODE];
