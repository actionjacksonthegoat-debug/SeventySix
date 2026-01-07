/**
 * Auth Error Utility - Unit Tests
 * TDD-first: Tests written before implementation
 * Tests error mapping logic for auth domain
 */

import { HttpErrorResponse } from "@angular/common/http";
import { describe, expect, it } from "vitest";
import { AUTH_ERROR_CODE } from "@auth/constants";
import { HTTP_STATUS } from "@shared/constants";
import { AuthErrorResult } from "@shared/models";
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

		describe("when error is BAD_REQUEST with unknown error code",
			() =>
			{
				it("should return error detail if available",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: {
										detail: "Custom error message",
										extensions: {
											errorCode: "UNKNOWN_CODE"
										}
									}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("Custom error message");
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
									error: {}
								});

						const result: AuthErrorResult =
							mapAuthError(error);

						expect(result.message)
							.toBe("An unexpected error occurred. Please try again.");
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
	});
