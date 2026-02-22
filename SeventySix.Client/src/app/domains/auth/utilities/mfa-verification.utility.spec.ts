// <copyright file="mfa-verification.utility.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { MFA_ERROR_CODE } from "@auth/constants";
import { describe, expect, it } from "vitest";
import {
	getBackupCodeErrorMessage,
	getMfaErrorMessage,
	requiresLoginRedirect
} from "./mfa-verification.utility";

describe("mfa-verification.utility",
	() =>
	{
		describe("getMfaErrorMessage",
			() =>
			{
				const displayMessage: string = "Verification failed. Please try again.";

				it("should return invalid code message for INVALID_CODE",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.INVALID_CODE,
								displayMessage);

						expect(result)
							.toBe("Invalid verification code. Please try again.");
					});

				it("should return invalid code message for TOTP_INVALID_CODE",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.TOTP_INVALID_CODE,
								displayMessage);

						expect(result)
							.toBe("Invalid verification code. Please try again.");
					});

				it("should return expired message for CODE_EXPIRED",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.CODE_EXPIRED,
								displayMessage);

						expect(result)
							.toBe("Code has expired. Please request a new code.");
					});

				it("should return too many attempts message for TOO_MANY_ATTEMPTS",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.TOO_MANY_ATTEMPTS,
								displayMessage);

						expect(result)
							.toBe("Too many attempts. Please request a new code.");
					});

				it("should return session expired for INVALID_CHALLENGE",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.INVALID_CHALLENGE,
								displayMessage);

						expect(result)
							.toBe("Session expired. Please log in again.");
					});

				it("should return session expired for CHALLENGE_USED",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.CHALLENGE_USED,
								displayMessage);

						expect(result)
							.toBe("Session expired. Please log in again.");
					});

				it("should return not enabled message for TOTP_NOT_ENABLED",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								MFA_ERROR_CODE.TOTP_NOT_ENABLED,
								displayMessage);

						expect(result)
							.toBe("Authenticator app is not set up. Please log in again.");
					});

				it("should return fallback for unknown error code",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								"UNKNOWN_ERROR_CODE",
								displayMessage);

						expect(result)
							.toBe(displayMessage);
					});

				it("should return fallback for undefined error code",
					() =>
					{
						const result: string =
							getMfaErrorMessage(
								undefined,
								displayMessage);

						expect(result)
							.toBe(displayMessage);
					});
			});

		describe("getBackupCodeErrorMessage",
			() =>
			{
				const displayMessage: string = "Verification failed. Please try again.";

				it("should return invalid backup code message for BACKUP_CODE_INVALID",
					() =>
					{
						const result: string =
							getBackupCodeErrorMessage(
								MFA_ERROR_CODE.BACKUP_CODE_INVALID,
								displayMessage);

						expect(result)
							.toBe("Invalid backup code. Please try again.");
					});

				it("should return already used message for BACKUP_CODE_ALREADY_USED",
					() =>
					{
						const result: string =
							getBackupCodeErrorMessage(
								MFA_ERROR_CODE.BACKUP_CODE_ALREADY_USED,
								displayMessage);

						expect(result)
							.toBe("This backup code has already been used.");
					});

				it("should return no codes available message for NO_BACKUP_CODES_AVAILABLE",
					() =>
					{
						const result: string =
							getBackupCodeErrorMessage(
								MFA_ERROR_CODE.NO_BACKUP_CODES_AVAILABLE,
								displayMessage);

						expect(result)
							.toBe("No backup codes available. Please contact support.");
					});

				it("should return fallback for unknown error code",
					() =>
					{
						const result: string =
							getBackupCodeErrorMessage(
								"UNKNOWN_ERROR_CODE",
								displayMessage);

						expect(result)
							.toBe(displayMessage);
					});

				it("should return fallback for undefined error code",
					() =>
					{
						const result: string =
							getBackupCodeErrorMessage(
								undefined,
								displayMessage);

						expect(result)
							.toBe(displayMessage);
					});
			});

		describe("requiresLoginRedirect",
			() =>
			{
				it("should return true for TOO_MANY_ATTEMPTS",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.TOO_MANY_ATTEMPTS))
							.toBe(true);
					});

				it("should return true for TOTP_TOO_MANY_ATTEMPTS",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.TOTP_TOO_MANY_ATTEMPTS))
							.toBe(true);
					});

				it("should return true for INVALID_CHALLENGE",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.INVALID_CHALLENGE))
							.toBe(true);
					});

				it("should return true for CHALLENGE_USED",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.CHALLENGE_USED))
							.toBe(true);
					});

				it("should return true for TOTP_NOT_ENABLED",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.TOTP_NOT_ENABLED))
							.toBe(true);
					});

				it("should return false for INVALID_CODE",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.INVALID_CODE))
							.toBe(false);
					});

				it("should return false for CODE_EXPIRED",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.CODE_EXPIRED))
							.toBe(false);
					});

				it("should return false for BACKUP_CODE_INVALID",
					() =>
					{
						expect(requiresLoginRedirect(MFA_ERROR_CODE.BACKUP_CODE_INVALID))
							.toBe(false);
					});

				it("should return false for unknown error code",
					() =>
					{
						expect(requiresLoginRedirect("UNKNOWN_ERROR_CODE"))
							.toBe(false);
					});

				it("should return false for undefined error code",
					() =>
					{
						expect(requiresLoginRedirect(undefined))
							.toBe(false);
					});
			});
	});