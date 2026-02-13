import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	HttpError,
	NetworkError,
	NotFoundError,
	UnauthorizedError,
	ValidationError
} from "@shared/models";
import { createMockLogger, createMockNotificationService } from "@shared/testing";
import { vi } from "vitest";
import { ClientErrorLoggerService } from "./client-error-logger.service";
import { ErrorHandlerService } from "./error-handler.service";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";

interface MockLoggerService
{
	error: ReturnType<typeof vi.fn>;
	warning: ReturnType<typeof vi.fn>;
	info: ReturnType<typeof vi.fn>;
	debug: ReturnType<typeof vi.fn>;
}

interface MockNotificationService
{
	errorWithDetails: ReturnType<typeof vi.fn>;
	success: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	warning: ReturnType<typeof vi.fn>;
	info: ReturnType<typeof vi.fn>;
}

interface MockClientErrorLoggerService
{
	logError: ReturnType<typeof vi.fn>;
	logHttpError: ReturnType<typeof vi.fn>;
	logWarning: ReturnType<typeof vi.fn>;
}

/**
 * Unit tests for `ErrorHandlerService`.
 * Covers error mapping, logging, notification, and HTTP error handling behavior.
 */
describe("ErrorHandlerService",
	() =>
	{
		let service: ErrorHandlerService;
		let mockLogger: MockLoggerService;
		let mockNotification: MockNotificationService;
		let mockClientLogger: MockClientErrorLoggerService;
		let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(
			() =>
			{
				consoleErrorSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});

				mockLogger =
					createMockLogger() as unknown as MockLoggerService;
				mockNotification =
					createMockNotificationService() as unknown as MockNotificationService;
				mockClientLogger =
					{
						logError: vi.fn(),
						logHttpError: vi.fn(),
						logWarning: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							ErrorHandlerService,
							{ provide: LoggerService, useValue: mockLogger },
							{ provide: NotificationService, useValue: mockNotification },
							{
								provide: ClientErrorLoggerService,
								useValue: mockClientLogger
							}
						]
					});

				service =
					TestBed.inject(ErrorHandlerService);
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		/**
	 * Helper to call handleError and ignore the expected re-throw in dev mode.
	 * Assertions on side effects (notifications, logging) should be made after calling this.
	 * @param error
	 * The error to pass to handleError.
	 */
		function callHandleErrorIgnoringRethrow(
			error: Error | HttpErrorResponse): void
		{
			try
			{
				service.handleError(error);
			}
			catch
			{
			// Expected: In non-production mode, errors are re-thrown after handling.
			// Side effects (notifications, logging) occur before the re-throw.
			}
		}

		/** Verifies the service is instantiated successfully. */
		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("handleError",
			() =>
			{
				/** Verifies logging and user notification for generic Error instances. */
				it("should log and notify for generic errors",
					() =>
					{
						callHandleErrorIgnoringRethrow(new Error("Test error"));

						expect(mockClientLogger.logError)
							.toHaveBeenCalled();
						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalled();
					});

				/** Verifies handling of HTTP 404 Not Found responses. */
				it("should handle HTTP 404 errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 404,
									statusText: "Not Found"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						expect(lastCall?.[0])
							.toContain("not found");
					});

				/** Verifies handling of HTTP 401 Unauthorized responses. */
				it("should handle HTTP 401 errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 401,
									statusText: "Unauthorized"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						expect(lastCall?.[0])
							.toContain("session");
					});

				/** Verifies handling of HTTP 500 Server Error responses. */
				it("should handle HTTP 500 errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						expect(lastCall?.[0])
							.toContain("Server error");
					});

				it("should handle ValidationError",
					() =>
					{
						const validationError: ValidationError =
							new ValidationError(
								"Validation failed",
								{ field1: ["Error 1"] });

						callHandleErrorIgnoringRethrow(validationError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								"Error 1",
								expect.anything(),
								expect.any(String));
					});

				it("should handle NotFoundError",
					() =>
					{
						const notFoundError: NotFoundError =
							new NotFoundError(
								"Resource not found");

						callHandleErrorIgnoringRethrow(notFoundError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								"Resource not found",
								undefined,
								expect.any(String));
					});

				it("should handle UnauthorizedError",
					() =>
					{
						const unauthorizedError: UnauthorizedError =
							new UnauthorizedError(
								"Not authorized");

						callHandleErrorIgnoringRethrow(unauthorizedError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								"Not authorized",
								undefined,
								expect.any(String));
					});

				it("should handle NetworkError",
					() =>
					{
						const networkError: NetworkError =
							new NetworkError();

						callHandleErrorIgnoringRethrow(networkError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								expect.stringContaining("Network error"),
								expect.arrayContaining(
									[
										expect.stringContaining("Technical:")
									]),
								expect.any(String));
					});

				it("should handle HttpError",
					() =>
					{
						const httpError: HttpError =
							new HttpError("Custom HTTP error", 418);

						callHandleErrorIgnoringRethrow(httpError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								"Custom HTTP error",
								undefined,
								expect.any(String));
					});
			});

		describe("ClientErrorLoggerService integration",
			() =>
			{
				it("should log errors to ClientErrorLoggerService",
					() =>
					{
						callHandleErrorIgnoringRethrow(new Error("Test error"));

						expect(mockClientLogger.logError)
							.toHaveBeenCalled();
					});

				it("should log HTTP errors to ClientErrorLoggerService",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									url: "https://api.example.com/data"
								});

						callHandleErrorIgnoringRethrow(httpError);

						expect(mockClientLogger.logHttpError)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										message: expect.any(String),
										httpError: httpError
									}));
					});
			});

		describe("copy data",
			() =>
			{
				it("should include timestamp in copy data",
					() =>
					{
						callHandleErrorIgnoringRethrow(new Error("Test error"));

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const copyData: string =
							lastCall?.[2] as string;
						expect(copyData)
							.toContain("timestamp");
					});

				it("should include stack trace in copy data",
					() =>
					{
						const testError: Error =
							new Error("Test error");
						testError.stack = "Error: Test error\n    at Object.<anonymous>";

						callHandleErrorIgnoringRethrow(testError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const copyData: string =
							lastCall?.[2] as string;
						expect(copyData)
							.toContain("stack");
					});

				it("should include request details in copy data for HTTP errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 404,
									statusText: "Not Found",
									url: "https://api.example.com/users/123"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const copyData: string =
							lastCall?.[2] as string;
						expect(copyData)
							.toContain("url");
						expect(copyData)
							.toContain("status");
					});

				it("should include details in copy data",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 400,
									statusText: "Bad Request",
									url: "https://api.example.com/data",
									error: { errors: { email: ["Email is required"] } }
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const copyData: string =
							lastCall?.[2] as string;
						expect(copyData)
							.toContain("details");
					});
			});

		describe("errorWithDetails notifications",
			() =>
			{
				it("should show error with details for HTTP validation errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 400,
									statusText: "Bad Request",
									url: "https://api.example.com/data",
									error: {
										title: "Validation failed",
										errors: {
											email: ["Email is required"],
											password: ["Password must be at least 8 characters"]
										}
									}
								});

						callHandleErrorIgnoringRethrow(httpError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								expect.any(String),
								expect.arrayContaining(
									[expect.stringContaining("email")]),
								expect.any(String));
					});

				it("should not show URL in user-visible details",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									url: "https://api.example.com/users/123"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const userDetails: string[] | undefined =
							lastCall?.[1] as string[] | undefined;

						if (userDetails)
						{
							for (const detail of userDetails)
							{
								expect(detail)
									.not
									.toMatch(/^URL:/);
							}
						}
					});

				it("should not show status line in user-visible details",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									url: "https://api.example.com/data"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const userDetails: string[] | undefined =
							lastCall?.[1] as string[] | undefined;

						if (userDetails)
						{
							for (const detail of userDetails)
							{
								expect(detail)
									.not
									.toMatch(/^Status:/);
							}
						}
					});

				it("should show server title in details for 4xx errors when different from message",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 401,
									statusText: "Unauthorized",
									error: {
										title: "Token Expired"
									}
								});

						callHandleErrorIgnoringRethrow(httpError);

						expect(mockNotification.errorWithDetails)
							.toHaveBeenCalledWith(
								expect.any(String),
								expect.arrayContaining(
									[expect.stringContaining("Token Expired")]),
								expect.any(String));
					});

				it("should not show server title in details for 5xx errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									error: {
										title: "Internal Server Error"
									}
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const userDetails: string[] | undefined =
							lastCall?.[1] as string[] | undefined;

						if (userDetails)
						{
							for (const detail of userDetails)
							{
								expect(detail)
									.not
									.toContain("Internal Server Error");
							}
						}
					});

				it("should show generic message for 500 errors without leaking server detail",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									error: {
										detail: "NullReferenceException at UserService.GetUser()"
									}
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const userMessage: string =
							lastCall?.[0] as string;
						const userDetails: string[] | undefined =
							lastCall?.[1] as string[] | undefined;

						expect(userMessage)
							.toBe("Server error. Please try again later.");

						if (userDetails)
						{
							for (const detail of userDetails)
							{
								expect(detail)
									.not
									.toContain("NullReferenceException");
							}
						}
					});

				it("should include full diagnostics in copy data for HTTP errors",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									url: "https://api.example.com/data"
								});

						callHandleErrorIgnoringRethrow(httpError);

						const lastCall: unknown[] | undefined =
							mockNotification.errorWithDetails.mock.lastCall;
						const copyData: string =
							lastCall?.[2] as string;

						expect(copyData)
							.toContain("url");
						expect(copyData)
							.toContain("status");
					});
			});

		describe("re-entry protection",
			() =>
			{
				it("should prevent re-entry when already handling an error",
					() =>
					{
						let callCount: number = 0;

						mockNotification.errorWithDetails.mockImplementation(
							() =>
							{
								callCount++;
								if (callCount === 1)
								{
									throw new Error("Notification failed");
								}
							});

						service.handleError(new Error("First error"));

						expect(consoleErrorSpy)
							.toHaveBeenCalledWith(
								"[ErrorHandler] Failed:",
								expect.any(Error));
					});

				it("should gracefully handle errors during notification",
					() =>
					{
						mockNotification.errorWithDetails.mockImplementation(
							() =>
							{
								throw new Error("Notification system failure");
							});

						expect(
							() =>
							{
								service.handleError(new Error("Test error"));
							})
							.not
							.toThrow();

						expect(consoleErrorSpy)
							.toHaveBeenCalled();
					});

				it("should reset guard flag after handling error",
					() =>
					{
						callHandleErrorIgnoringRethrow(new Error("First error"));
						callHandleErrorIgnoringRethrow(new Error("Second error"));

						expect(mockClientLogger.logError)
							.toHaveBeenCalledTimes(2);
					});
			});
	});
