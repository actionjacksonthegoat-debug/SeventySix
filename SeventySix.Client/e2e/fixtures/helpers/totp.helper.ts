// <copyright file="totp.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import * as OTPAuth from "otpauth";
import type { Page } from "@playwright/test";
import { E2E_CONFIG, API_ROUTES } from "../config.constant";
import type { TestUser } from "../test-users.constant";

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
				period: E2E_CONFIG.totpTimeStepSeconds,
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
				period: E2E_CONFIG.totpTimeStepSeconds,
				secret: totpSecret,
			});

	return totp.generate();
}

/**
 * Waits until we are at least `safeMarginSeconds` into a fresh TOTP time step.
 * Prevents generating codes near the boundary that expire during form submission.
 *
 * @param safeMarginSeconds
 * Minimum seconds remaining in the current time step (default: 3).
 */
export async function waitForFreshTotpWindow(
	safeMarginSeconds: number = 3): Promise<void>
{
	const stepSeconds: number = E2E_CONFIG.totpTimeStepSeconds;
	const now: number = Math.floor(Date.now() / 1000);
	const secondsIntoStep: number = now % stepSeconds;
	const secondsRemaining: number = stepSeconds - secondsIntoStep;

	if (secondsRemaining <= safeMarginSeconds)
	{
		const waitMs: number = (secondsRemaining + 1) * 1000;
		await new Promise(
			(resolve) => setTimeout(resolve, waitMs));
	}
}

/**
 * Generates a TOTP code guaranteed to be in a fresh time window.
 * Use this instead of `generateTotpCode()` in all E2E tests.
 *
 * @returns
 * A 6-digit TOTP code string.
 */
export async function generateSafeTotpCode(): Promise<string>
{
	await waitForFreshTotpWindow();
	return generateTotpCode();
}

/**
 * Generates a TOTP code from an arbitrary secret, with time-window safety.
 * Use this instead of `generateTotpCodeFromSecret()` in enrollment tests.
 *
 * @param totpSecret
 * The Base32-encoded TOTP secret.
 *
 * @returns
 * A 6-digit TOTP code string.
 */
export async function generateSafeTotpCodeFromSecret(totpSecret: string): Promise<string>
{
	await waitForFreshTotpWindow();
	return generateTotpCodeFromSecret(totpSecret);
}

/**
 * Best-effort TOTP cleanup: waits for a fresh code, re-authenticates, and disables TOTP via API.
 * Silently returns without throwing if any step fails — the test user is isolated so leftover
 * TOTP state does not affect other tests.
 *
 * @param page
 * The Playwright page (used for request context and cookies).
 * @param user
 * The test user credentials.
 * @param secret
 * The TOTP secret extracted during enrollment.
 * @param enrollmentCode
 * The code used during enrollment (must differ from the cleanup code).
 */
export async function disableTotpViaApi(
	page: Page,
	user: TestUser,
	secret: string,
	enrollmentCode: string): Promise<void>
{
	// Wait for a fresh TOTP code that differs from the enrollment code.
	let cleanupCode: string =
		generateTotpCodeFromSecret(secret);
	const maxWaitMs: number =
		(E2E_CONFIG.totpTimeStepSeconds + 5) * 1000;
	const startTime: number =
		Date.now();

	while (cleanupCode === enrollmentCode
		&& (Date.now() - startTime) < maxWaitMs)
	{
		await new Promise(
			(resolve) => setTimeout(resolve, 2000));
		cleanupCode =
			generateTotpCodeFromSecret(secret);
	}

	if (cleanupCode === enrollmentCode)
	{
		return;
	}

	const cookies =
		await page.context().cookies();
	const cookieHeader: string =
		cookies
			.map(
				(cookie) => `${cookie.name}=${cookie.value}`)
			.join("; ");

	const loginResponse =
		await page.request.post(
			`${E2E_CONFIG.apiBaseUrl}${API_ROUTES.auth.login}`,
			{
				data:
					{
						usernameOrEmail: user.email,
						password: user.password
					},
				headers:
					{
						Cookie: cookieHeader
					}
			});

	if (!loginResponse.ok())
	{
		return;
	}

	const loginData =
		await loginResponse.json();

	if (!loginData.requiresMfa)
	{
		return;
	}

	const verifyResponse =
		await page.request.post(
			`${E2E_CONFIG.apiBaseUrl}${API_ROUTES.auth.totpVerify}`,
			{
				data:
					{
						email: user.email,
						code: cleanupCode,
						challengeToken: loginData.mfaChallengeToken,
						trustDevice: false
					},
				headers:
					{
						Cookie: cookieHeader
					}
			});

	if (!verifyResponse.ok())
	{
		return;
	}

	const verifyData =
		await verifyResponse.json();

	await page.request.post(
		`${E2E_CONFIG.apiBaseUrl}${API_ROUTES.auth.totpDisable}`,
		{
			data:
				{
					password: user.password
				},
			headers:
				{
					Authorization: `Bearer ${verifyData.accessToken}`,
					Cookie: cookieHeader
				}
		});
}
