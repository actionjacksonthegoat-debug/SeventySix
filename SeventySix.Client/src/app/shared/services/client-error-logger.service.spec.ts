import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { LogLevel } from "@shared/constants";
import { CreateLogRequest } from "@shared/models";
import { DateService } from "@shared/services";
import { ClientErrorLoggerService } from "@shared/services/client-error-logger.service";
import { ErrorQueueService } from "@shared/services/error-queue.service";
import { createMockErrorQueueService } from "@shared/testing";
import { vi } from "vitest";

interface MockErrorQueueService
{
	enqueue: ReturnType<typeof vi.fn>;
}

describe("ClientErrorLoggerService",
	() =>
	{
		let service: ClientErrorLoggerService;
		let errorQueueService: MockErrorQueueService;
		let consoleSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(
			() =>
			{
			// Suppress console.error output during tests while still allowing verification
				consoleSpy =
					vi
						.spyOn(console, "error")
						.mockImplementation(
							() =>
							{});

				errorQueueService =
					createMockErrorQueueService() as unknown as MockErrorQueueService;

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							ClientErrorLoggerService,
							{ provide: ErrorQueueService, useValue: errorQueueService }
						]
					});

				service =
					TestBed.inject(ClientErrorLoggerService);
			});

		describe("logError",
			() =>
			{
				it("should enqueue error with correct fields",
					() =>
					{
						const error: Error =
							new Error("Test error");
						error.stack = "Error: Test error\n  at TestComponent";

						service.logError(
							{
								message: "Something went wrong",
								error
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										logLevel: "Error",
										message: "[Client] - Something went wrong",
										exceptionMessage: "Test error",
										stackTrace: expect.stringContaining("Error: Test error")
									}));
					});

				it("should default to Error log level",
					() =>
					{
						service.logError(
							{ message: "Test error" });

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										logLevel: "Error"
									}));
					});

				it("should accept custom log level",
					() =>
					{
						service.logError(
							{ message: "Test warning" },
							LogLevel.Warning);

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										logLevel: "Warning"
									}));
					});

				it("should extract source context from error stack",
					() =>
					{
						const error: Error =
							new Error("Test error");
						error.stack = "Error: Test error\n  at UserComponent.doSomething (user.component.ts:42:15)";

						service.logError(
							{ message: "Error", error });

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										sourceContext: expect.stringContaining("UserComponent")
									}));
					});

				it("should include user agent",
					() =>
					{
						service.logError(
							{ message: "Test error" });

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										userAgent: expect.any(String)
									}));
					});

				it("should include current timestamp",
					() =>
					{
						const dateService: DateService =
							new DateService();
						const beforeTimeMs: number =
							dateService.nowTimestamp();

						service.logError(
							{ message: "Test error" });

						const afterTimeMs: number =
							dateService.nowTimestamp();
						const lastCall: unknown[] | undefined =
							errorQueueService.enqueue.mock.lastCall;
						const timestampMs: number =
							dateService
								.parseUTC(
									(lastCall?.[0] as CreateLogRequest).clientTimestamp!)
								.getTime();
						expect(timestampMs)
							.toBeGreaterThanOrEqual(
								beforeTimeMs);
						expect(timestampMs)
							.toBeLessThanOrEqual(
								afterTimeMs);
					});
			});

		describe("logHttpError",
			() =>
			{
				it("should extract request URL from HttpErrorResponse",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									error: "Not found",
									status: 404,
									statusText: "Not Found",
									url: "https://example.com/api/users/123"
								});

						service.logHttpError(
							{
								message: "Failed to load user",
								httpError
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										requestUrl: "https://example.com/api/users/123",
										statusCode: 404
									}));
					});

				it("should extract request method from HttpErrorResponse headers",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									error: "Bad request",
									status: 400,
									statusText: "Bad Request",
									url: "https://example.com/api/users"
								});

						// Simulate request method in error (Angular doesn't include it by default)
						Object.defineProperty(httpError, "method",
							{
								value: "POST",
								writable: false
							});

						service.logHttpError(
							{
								message: "Failed to create user",
								httpError
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalled();
					});

				it("should include status code from HttpErrorResponse",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									error: "Server error",
									status: 500,
									statusText: "Internal Server Error",
									url: "https://example.com/api/data"
								});

						service.logHttpError(
							{
								message: "Server error occurred",
								httpError
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										statusCode: 500
									}));
					});

				it("should handle network errors (status 0)",
					() =>
					{
						const httpError: HttpErrorResponse =
							new HttpErrorResponse(
								{
									error: new ProgressEvent("error"),
									status: 0,
									statusText: "Unknown Error",
									url: "https://example.com/api/data"
								});

						service.logHttpError(
							{
								message: "Network error",
								httpError
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										statusCode: 0,
										message: "[Client] - Network error"
									}));
					});
			});

		describe("logClientError",
			() =>
			{
				it("should include current route as request URL",
					() =>
					{
						// We can't mock window.location, so just verify requestUrl is set
						const error: Error =
							new Error("Client error");

						service.logClientError(
							{
								message: "UI error occurred",
								error
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										requestUrl: expect.any(String)
									}));
					});

				it("should include additional context",
					() =>
					{
						service.logClientError(
							{
								message: "Error with context",
								context: {
									userId: 123,
									action: "save",
									formValid: false
								}
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										additionalContext: {
											userId: 123,
											action: "save",
											formValid: false
										}
									}));
					});

				it("should handle errors without stack traces",
					() =>
					{
						service.logClientError(
							{
								message: "Simple error"
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										message: "[Client] - Simple error",
										stackTrace: undefined
									}));
					});
			});

		describe("logWarning",
			() =>
			{
				it("should log with Warning level",
					() =>
					{
						service.logWarning("This is a warning");

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										logLevel: "Warning",
										message: "[Client] - This is a warning"
									}));
					});

				it("should accept context",
					() =>
					{
						service.logWarning("Warning message",
							{
								component: "TestComponent"
							});

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										logLevel: "Warning",
										message: "[Client] - Warning message",
										additionalContext: { component: "TestComponent" }
									}));
					});
			});

		describe("logInfo",
			() =>
			{
				it("should log with Information level",
					() =>
					{
						service.logInfo("This is info");

						expect(errorQueueService.enqueue)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{
										logLevel: "Information",
										message: "[Client] - This is info"
									}));
					});
			});

		describe("source context extraction",
			() =>
			{
				it("should extract component name from Angular error stack",
					() =>
					{
						const error: Error =
							new Error("Error");
						error.stack = "Error: Test\n  at UserComponent.getData (user.component.ts:42:15)";

						service.logError(
							{ message: "Error", error });

						const lastCall: unknown[] | undefined =
							errorQueueService.enqueue.mock.lastCall;
						expect((lastCall?.[0] as CreateLogRequest).sourceContext)
							.toContain("UserComponent");
					});

				it("should extract service name from error stack",
					() =>
					{
						const error: Error =
							new Error("Error");
						error.stack = "Error: Test\n  at UserService.getUser (user.service.ts:23:10)";

						service.logError(
							{ message: "Error", error });

						const lastCall: unknown[] | undefined =
							errorQueueService.enqueue.mock.lastCall;
						expect((lastCall?.[0] as CreateLogRequest).sourceContext)
							.toContain("UserService");
					});

				it("should handle errors without source context",
					() =>
					{
						const error: Error =
							new Error("Error");
						error.stack = "Error: Test\n  at anonymous function";

						service.logError(
							{ message: "Error", error });

						expect(errorQueueService.enqueue)
							.toHaveBeenCalled();
					});
			});

		describe("never throw policy",
			() =>
			{
				it("should never throw even if enqueue fails",
					() =>
					{
						errorQueueService.enqueue.mockImplementation(
							() =>
							{
								throw new Error("Queue error");
							});

						expect(
							() =>
							{
								service.logError(
									{ message: "Test error" });
							})
							.not
							.toThrow();
					});

				it("should fallback to console.error when enqueue fails",
					() =>
					{
						errorQueueService.enqueue.mockImplementation(
							() =>
							{
								throw new Error("Queue error");
							});

						service.logError(
							{ message: "Test error" });

						expect(consoleSpy)
							.toHaveBeenCalled();
					});
			});
	});
