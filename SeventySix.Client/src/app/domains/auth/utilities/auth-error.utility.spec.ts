/**
 * Auth Error Utility - Unit Tests
 * TDD-first: Tests written before implementation
 * Tests error mapping logic for auth domain
 */

import { HttpErrorResponse } from "@angular/common/http";
import { AUTH_ERROR_CODE } from "@auth/constants";
import { HTTP_STATUS } from "@shared/constants";
import { AuthErrorResult } from "@shared/models";
import { describe, expect, it } from "vitest";
import { mapAuthError } from "./auth-error.utility";

describe("mapAuthError",
	() =>
	{
		describe("when error is BAD_REQUEST with TOKEN_EXPIRED",
			() =>
			{
				it("should return expired message and invalidate token",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.TOKEN_EXPIRED
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("This link has expired. Please request a new one.");
						expect(result.invalidateToken)
							.toBe(true);
					});
			});

		describe("when error is BAD_REQUEST with INVALID_TOKEN",
			() =>
			{
				it("should return expired message and invalidate token",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.INVALID_TOKEN
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("This link has expired. Please request a new one.");
						expect(result.invalidateToken)
							.toBe(true);
					});
			});

		describe("when error is BAD_REQUEST with USERNAME_EXISTS",
			() =>
			{
				it("should return username taken message without invalidating token",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.USERNAME_EXISTS
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("This username is already taken. Please choose another.");
						expect(result.invalidateToken)
							.toBe(false);
					});
			});

		describe("when error is BAD_REQUEST with BREACHED_PASSWORD",
			() =>
			{
				it("should return breached password message without invalidating token",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.BREACHED_PASSWORD
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("This password has been found in a data breach. Please choose a different password.");
						expect(result.invalidateToken)
							.toBe(false);
					});
			});

		describe("when error is BAD_REQUEST with unknown error code",
			() =>
			{
				it("should return generic fallback message without leaking server detail",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										detail: "Sensitive internal detail",
										extensions: {
											errorCode: "UNKNOWN_CODE"
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Invalid request. Please check your input.");
						expect(result.message)
							.not
							.toContain("Sensitive");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should return default message if detail not available",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: "UNKNOWN_CODE"
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Invalid request. Please check your input.");
						expect(result.invalidateToken)
							.toBe(false);
					});
			});

		describe("when error is not BAD_REQUEST",
			() =>
			{
				it("should return generic error message for server errors",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									error: {
										detail: "Stack trace: NullReferenceException at..."
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("An unexpected error occurred. Please try again.");
						expect(result.message)
							.not
							.toContain("Stack trace");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should return generic error message for network errors",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 0,
									error: {}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("An unexpected error occurred. Please try again.");
						expect(result.invalidateToken)
							.toBe(false);
					});
			});

		describe("expanded error codes",
			() =>
			{
				it("should return safe message for INVALID_CREDENTIALS",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										detail: "Invalid credentials",
										extensions: {
											errorCode: AUTH_ERROR_CODE.INVALID_CREDENTIALS
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Invalid username or password.");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should return safe message for ACCOUNT_LOCKED",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.ACCOUNT_LOCKED
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Your account has been locked. Please try again later.");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should return safe message for ACCOUNT_INACTIVE",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.ACCOUNT_INACTIVE
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Your account is inactive. Please contact support.");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should return safe message for WEAK_PASSWORD",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.WEAK_PASSWORD
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toContain("does not meet the requirements");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should return safe message for EMAIL_NOT_CONFIRMED",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.EMAIL_NOT_CONFIRMED
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Please verify your email address before signing in.");
						expect(result.invalidateToken)
							.toBe(false);
					});

				it("should invalidate token for REGISTRATION_FAILED",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.REGISTRATION_FAILED
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Registration could not be completed. Please try again.");
						expect(result.invalidateToken)
							.toBe(true);
					});

				it("should invalidate token for INVALID_PASSWORD_RESET_TOKEN",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.INVALID_PASSWORD_RESET_TOKEN
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toContain("expired or is invalid");
						expect(result.invalidateToken)
							.toBe(true);
					});

				it("should invalidate token for INVALID_EMAIL_VERIFICATION_TOKEN",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										extensions: {
											errorCode: AUTH_ERROR_CODE.INVALID_EMAIL_VERIFICATION_TOKEN
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toContain("expired or is invalid");
						expect(result.invalidateToken)
							.toBe(true);
					});
			});
	});
