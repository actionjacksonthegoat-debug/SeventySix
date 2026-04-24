/**
 * Mutation Error Utility - Unit Tests
 * TDD-first: Tests written before implementation
 * Tests safe error message extraction for TanStack mutation onError callbacks
 */

import { HttpErrorResponse } from "@angular/common/http";
import { HTTP_STATUS } from "@shared/constants";
import { describe, expect, it } from "vitest";
import { getMutationErrorMessage } from "./mutation-error.utility";

describe("getMutationErrorMessage",
	() =>
	{
		describe("getMutationErrorMessage_Returns4xxDetail_WhenResponseIs400Range",
			() =>
			{
				it("should return server detail for 400 response",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: { detail: "Validation failed for the request." }
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.toBe("Validation failed for the request.");
					});

				it("should return server detail for 404 response",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.NOT_FOUND,
									error: { detail: "Resource was not found." }
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.toBe("Resource was not found.");
					});

				it("should return server detail for 409 response",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.CONFLICT,
									error: { detail: "A conflict occurred." }
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.toBe("A conflict occurred.");
					});
			});

		describe("getMutationErrorMessage_ReturnsGenericMessage_WhenResponseIs500Range",
			() =>
			{
				it("should return generic fallback for 500, never raw server detail",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
									error: { detail: "NullReferenceException at line 42 in MyService.cs" }
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.not
							.toContain("NullReferenceException");
						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});

				it("should return generic fallback for 502 Bad Gateway",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_GATEWAY,
									error: { detail: "Upstream server unavailable" }
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.not
							.toContain("Upstream");
						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});
			});

		describe("getMutationErrorMessage_ReturnsFallback_When4xxHasNoDetail",
			() =>
			{
				it("should return fallback when 400 has errorCode but no detail",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: { extensions: { errorCode: "InvalidToken" } }
								});

						const rawErrorMessage: string =
							error.message;

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.not
							.toBe(rawErrorMessage);
						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});
			});

		describe("getMutationErrorMessage_ReturnsGenericMessage_WhenErrorIsNetworkLevel",
			() =>
			{
				it("should return generic fallback for network-level errors (status 0)",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.NETWORK_ERROR,
									error: new ProgressEvent("error")
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});
			});

		describe("getMutationErrorMessage_ReturnsCustomFallback_WhenProvided",
			() =>
			{
				it("should use custom fallback for 500 responses",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
									error: { detail: "Stack trace here" }
								});

						const result: string =
							getMutationErrorMessage(
								error,
								"Failed to save changes");

						expect(result)
							.toBe("Failed to save changes");
					});

				it("should use custom fallback for unknown error shapes",
					() =>
					{
						const result: string =
							getMutationErrorMessage(
								new Error("Network timeout"),
								"Failed to load data");

						expect(result)
							.toBe("Failed to load data");
					});
			});

		describe("getMutationErrorMessage_NeverReturnsRawErrorMessage_ForUnknownShape",
			() =>
			{
				it("should return generic fallback for plain Error, not error.message",
					() =>
					{
						const error: Error =
							new Error("Internal system detail");

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.not
							.toContain("Internal system detail");
						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});

				it("should return generic fallback for null",
					() =>
					{
						const result: string =
							getMutationErrorMessage(null);

						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});

				it("should return generic fallback for undefined",
					() =>
					{
						const result: string =
							getMutationErrorMessage(undefined);

						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});

				it("should return generic fallback for a string error",
					() =>
					{
						const result: string =
							getMutationErrorMessage("some raw error string");

						expect(result)
							.toBe("An unexpected error occurred. Please try again.");
					});
			});

		describe("getMutationErrorMessage_StripsControlCharacters_FromAnyDisplayedText",
			() =>
			{
				it("should strip CR and LF from 4xx detail",
					() =>
					{
						const error: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: HTTP_STATUS.BAD_REQUEST,
									error: { detail: "Line 1\r\nLine 2\nLine 3\r" }
								});

						const result: string =
							getMutationErrorMessage(error);

						expect(result)
							.not
							.toContain("\r");
						expect(result)
							.not
							.toContain("\n");
						expect(result)
							.toBe("Line 1Line 2Line 3");
					});
			});
	});