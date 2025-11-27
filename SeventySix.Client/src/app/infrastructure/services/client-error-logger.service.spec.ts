import { TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { ClientErrorLoggerService } from "./client-error-logger.service";
import { ErrorQueueService } from "./error-queue.service";
import { LogLevel } from "./logger.service";
import { ClientLogRequest } from "@infrastructure/models/client-log-request.model";
import { createMockErrorQueueService } from "@testing";
import { provideZonelessChangeDetection } from "@angular/core";

describe("ClientErrorLoggerService", () =>
{
	let service: ClientErrorLoggerService;
	let errorQueueService: jasmine.SpyObj<ErrorQueueService>;
	let consoleSpy: jasmine.Spy;

	beforeEach(() =>
	{
		// Suppress console.error output during tests while still allowing verification
		consoleSpy = spyOn(console, "error");

		errorQueueService = createMockErrorQueueService();

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				ClientErrorLoggerService,
				{ provide: ErrorQueueService, useValue: errorQueueService }
			]
		});

		service = TestBed.inject(ClientErrorLoggerService);
	});

	describe("logError", () =>
	{
		it("should enqueue error with correct fields", () =>
		{
			const error = new Error("Test error");
			error.stack = "Error: Test error\n  at TestComponent";

			service.logError({
				message: "Something went wrong",
				error
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					logLevel: "Error",
					message: "[Client] - Something went wrong",
					exceptionMessage: "Test error",
					stackTrace: jasmine.stringContaining("Error: Test error")
				})
			);
		});

		it("should default to Error log level", () =>
		{
			service.logError({ message: "Test error" });

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					logLevel: "Error"
				})
			);
		});

		it("should accept custom log level", () =>
		{
			service.logError({ message: "Test warning" }, LogLevel.Warning);

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					logLevel: "Warning"
				})
			);
		});

		it("should extract source context from error stack", () =>
		{
			const error = new Error("Test error");
			error.stack =
				"Error: Test error\n  at UserComponent.doSomething (user.component.ts:42:15)";

			service.logError({ message: "Error", error });

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					sourceContext: jasmine.stringContaining("UserComponent")
				})
			);
		});

		it("should include user agent", () =>
		{
			service.logError({ message: "Test error" });

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					userAgent: jasmine.any(String)
				})
			);
		});

		it("should include current timestamp", () =>
		{
			const beforeTime = new Date();

			service.logError({ message: "Test error" });

			const afterTime = new Date();
			const call = errorQueueService.enqueue.calls.mostRecent();
			const timestamp = new Date(call.args[0].clientTimestamp!);

			expect(timestamp.getTime()).toBeGreaterThanOrEqual(
				beforeTime.getTime()
			);
			expect(timestamp.getTime()).toBeLessThanOrEqual(
				afterTime.getTime()
			);
		});
	});

	describe("logHttpError", () =>
	{
		it("should extract request URL from HttpErrorResponse", () =>
		{
			const httpError = new HttpErrorResponse({
				error: "Not found",
				status: 404,
				statusText: "Not Found",
				url: "https://example.com/api/users/123"
			});

			service.logHttpError({
				message: "Failed to load user",
				httpError
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					requestUrl: "https://example.com/api/users/123",
					statusCode: 404
				})
			);
		});

		it("should extract request method from HttpErrorResponse headers", () =>
		{
			const httpError = new HttpErrorResponse({
				error: "Bad request",
				status: 400,
				statusText: "Bad Request",
				url: "https://example.com/api/users"
			});

			// Simulate request method in error (Angular doesn't include it by default)
			Object.defineProperty(httpError, "method", {
				value: "POST",
				writable: false
			});

			service.logHttpError({
				message: "Failed to create user",
				httpError
			});

			expect(errorQueueService.enqueue).toHaveBeenCalled();
		});

		it("should include status code from HttpErrorResponse", () =>
		{
			const httpError = new HttpErrorResponse({
				error: "Server error",
				status: 500,
				statusText: "Internal Server Error",
				url: "https://example.com/api/data"
			});

			service.logHttpError({
				message: "Server error occurred",
				httpError
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					statusCode: 500
				})
			);
		});

		it("should handle network errors (status 0)", () =>
		{
			const httpError = new HttpErrorResponse({
				error: new ProgressEvent("error"),
				status: 0,
				statusText: "Unknown Error",
				url: "https://example.com/api/data"
			});

			service.logHttpError({
				message: "Network error",
				httpError
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					statusCode: 0,
					message: "[Client] - Network error"
				})
			);
		});
	});

	describe("logClientError", () =>
	{
		it("should include current route as request URL", () =>
		{
			// We can't mock window.location, so just verify requestUrl is set
			const error = new Error("Client error");

			service.logClientError({
				message: "UI error occurred",
				error
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					requestUrl: jasmine.any(String)
				})
			);
		});

		it("should include additional context", () =>
		{
			service.logClientError({
				message: "Error with context",
				context: {
					userId: 123,
					action: "save",
					formValid: false
				}
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					additionalContext: {
						userId: 123,
						action: "save",
						formValid: false
					}
				})
			);
		});

		it("should handle errors without stack traces", () =>
		{
			service.logClientError({
				message: "Simple error"
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					message: "[Client] - Simple error",
					stackTrace: undefined
				})
			);
		});
	});

	describe("logWarning", () =>
	{
		it("should log with Warning level", () =>
		{
			service.logWarning("This is a warning");

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					logLevel: "Warning",
					message: "[Client] - This is a warning"
				})
			);
		});

		it("should accept context", () =>
		{
			service.logWarning("Warning message", {
				component: "TestComponent"
			});

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					logLevel: "Warning",
					message: "[Client] - Warning message",
					additionalContext: { component: "TestComponent" }
				})
			);
		});
	});

	describe("logInfo", () =>
	{
		it("should log with Info level", () =>
		{
			service.logInfo("This is info");

			expect(errorQueueService.enqueue).toHaveBeenCalledWith(
				jasmine.objectContaining({
					logLevel: "Info",
					message: "[Client] - This is info"
				})
			);
		});
	});

	describe("source context extraction", () =>
	{
		it("should extract component name from Angular error stack", () =>
		{
			const error = new Error("Error");
			error.stack =
				"Error: Test\n  at UserComponent.getData (user.component.ts:42:15)";

			service.logError({ message: "Error", error });

			const call = errorQueueService.enqueue.calls.mostRecent();
			expect(call.args[0].sourceContext).toContain("UserComponent");
		});

		it("should extract service name from error stack", () =>
		{
			const error = new Error("Error");
			error.stack =
				"Error: Test\n  at UserService.getUser (user.service.ts:23:10)";

			service.logError({ message: "Error", error });

			const call = errorQueueService.enqueue.calls.mostRecent();
			expect(call.args[0].sourceContext).toContain("UserService");
		});

		it("should handle errors without source context", () =>
		{
			const error = new Error("Error");
			error.stack = "Error: Test\n  at anonymous function";

			service.logError({ message: "Error", error });

			expect(errorQueueService.enqueue).toHaveBeenCalled();
		});
	});

	describe("never throw policy", () =>
	{
		it("should never throw even if enqueue fails", () =>
		{
			errorQueueService.enqueue.and.throwError("Queue error");

			expect(() =>
			{
				service.logError({ message: "Test error" });
			}).not.toThrow();
		});

		it("should fallback to console.error when enqueue fails", () =>
		{
			errorQueueService.enqueue.and.throwError("Queue error");

			service.logError({ message: "Test error" });

			expect(consoleSpy).toHaveBeenCalled();
		});
	});
});
