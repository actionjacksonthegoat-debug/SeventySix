// <copyright file="mfa.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * MFA method enum values matching server-side definitions.
 * Email = 0, TOTP = 1.
 */
export const MFA_METHOD: Readonly<{
	email: number;
	totp: number;
}> =
	{
		email: 0,
		totp: 1
	} as const;

/**
 * Type for MFA method values.
 */
export type MfaMethodType = (typeof MFA_METHOD)[keyof typeof MFA_METHOD];

/**
 * Configuration constants for MFA code handling.
 */
export const MFA_CONFIG: Readonly<{
	codeLength: number;
	backupCodeLength: number;
	resendCooldownSeconds: number;
}> =
	{
		codeLength: 6,
		backupCodeLength: 8,
		resendCooldownSeconds: 60
	} as const;

/**
 * QR code generation configuration for TOTP setup.
 */
export const QR_CODE_CONFIG: Readonly<{
	width: number;
	margin: number;
	colors: {
		dark: string;
		light: string;
	};
}> =
	{
		width: 200,
		margin: 2,
		colors: {
			dark: "#000000",
			light: "#FFFFFF"
		}
	} as const;

/**
 * Delay in milliseconds before resetting clipboard copy state.
 * Used for visual feedback timing in copy-to-clipboard buttons.
 */
export const CLIPBOARD_RESET_DELAY_MS: number = 3000;
