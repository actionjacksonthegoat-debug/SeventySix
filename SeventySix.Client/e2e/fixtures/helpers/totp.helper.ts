// <copyright file="totp.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import * as OTPAuth from "otpauth";

/**
 * Known TOTP secret for the E2E MFA test user.
 * Must match E2ESeederConstants.MfaTotpSecret in the server seeder.
 */
const E2E_TOTP_SECRET =
	"JBSWY3DPEHPK3PXP";

/**
 * Generates a valid TOTP code for the E2E MFA test user.
 * Uses the same secret that was seeded in the database.
 *
 * @returns
 * A 6-digit TOTP code string.
 */
export function generateTotpCode(): string
{
	const totp: OTPAuth.TOTP =
		new OTPAuth.TOTP(
			{
				issuer: "SeventySix",
				label: "e2e_mfa_user@test.local",
				algorithm: "SHA1",
				digits: 6,
				period: 30,
				secret: E2E_TOTP_SECRET,
			});

	return totp.generate();
}

/**
 * Generates a valid TOTP code from an arbitrary secret.
 * Used for TOTP enrollment tests where the secret is extracted from the setup page.
 *
 * @param totpSecret
 * The Base32-encoded TOTP secret.
 *
 * @returns
 * A 6-digit TOTP code string.
 */
export function generateTotpCodeFromSecret(totpSecret: string): string
{
	const totp: OTPAuth.TOTP =
		new OTPAuth.TOTP(
			{
				issuer: "SeventySix",
				algorithm: "SHA1",
				digits: 6,
				period: 30,
				secret: totpSecret,
			});

	return totp.generate();
}
