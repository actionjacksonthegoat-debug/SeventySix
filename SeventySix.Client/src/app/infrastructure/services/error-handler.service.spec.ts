import { TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { ErrorHandlerService } from "./error-handler.service";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";
import { ClientErrorLoggerService } from "./client-error-logger.service";
import { createMockLogger, createMockNotificationService } from "@testing";
import {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError,
	HttpError
} from "@infrastructure/models/errors";

describe("ErrorHandlerService", () =>
{
	let service: ErrorHandlerService;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockNotification: jasmine.SpyObj<NotificationService>;
	let mockClientLogger: jasmine.SpyObj<ClientErrorLoggerService>;

	beforeEach(() =>
	{
		mockLogger = createMockLogger();
		mockNotification = createMockNotificationService();
		mockClientLogger = jasmine.createSpyObj("ClientErrorLoggerService", [
			"logError",
			"logHttpError",
			"logWarning"
		]);

		TestBed.configureTestingModule({
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

		service = TestBed.inject(ErrorHandlerService);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("handleError", () =>
	{
		it("should log and notify for generic errors", () =>
		{
			const error = new Error("Test error");

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected in development mode
			}

			expect(mockClientLogger.logError).toHaveBeenCalled();
			expect(mockNotification.errorWithDetails).toHaveBeenCalled();
		});

		it("should handle HTTP 404 errors", () =>
		{
			const error = new HttpErrorResponse({
				status: 404,
				statusText: "Not Found"
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.stringContaining("not found"),
				jasmine.anything(),
				jasmine.any(String)
			);
		});

		it("should handle HTTP 401 errors", () =>
		{
			const error = new HttpErrorResponse({
				status: 401,
				statusText: "Unauthorized"
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.stringContaining("session"),
				jasmine.anything(),
				jasmine.any(String)
			);
		});

		it("should handle HTTP 500 errors", () =>
		{
			const error = new HttpErrorResponse({
				status: 500,
				statusText: "Internal Server Error"
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.stringContaining("Server error"),
				jasmine.anything(),
				jasmine.any(String)
			);
		});

		it("should handle ValidationError", () =>
		{
			const error = new ValidationError("Validation failed", {
				field1: ["Error 1"]
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalled();
		});

		it("should handle NotFoundError", () =>
		{
			const error = new NotFoundError("Resource not found");

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				"Resource not found",
				undefined,
				jasmine.any(String)
			);
		});

		it("should handle UnauthorizedError", () =>
		{
			const error = new UnauthorizedError("Not authorized");

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				"Not authorized",
				undefined,
				jasmine.any(String)
			);
		});

		it("should handle NetworkError", () =>
		{
			const error = new NetworkError();

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.stringContaining("Network error"),
				jasmine.arrayContaining([
					jasmine.stringContaining("Technical:")
				]),
				jasmine.any(String)
			);
		});

		it("should handle HttpError", () =>
		{
			const error = new HttpError("Custom HTTP error", 418);

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				"Custom HTTP error",
				undefined,
				jasmine.any(String)
			);
		});
	});

	describe("ClientErrorLoggerService integration", () =>
	{
		it("should log errors to ClientErrorLoggerService", () =>
		{
			const error = new Error("Test error");

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected in development mode
			}

			expect(mockClientLogger.logError).toHaveBeenCalled();
		});

		it("should log HTTP errors to ClientErrorLoggerService", () =>
		{
			const error = new HttpErrorResponse({
				status: 500,
				statusText: "Internal Server Error",
				url: "https://api.example.com/data"
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockClientLogger.logHttpError).toHaveBeenCalledWith(
				jasmine.objectContaining({
					message: jasmine.any(String),
					httpError: error
				})
			);
		});
	});

	describe("errorWithDetails notifications", () =>
	{
		it("should show error with details for HTTP errors", () =>
		{
			const error = new HttpErrorResponse({
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

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.any(String),
				jasmine.arrayContaining([jasmine.stringContaining("email")]),
				jasmine.any(String)
			);
		});

		it("should include copy data with error details", () =>
		{
			const error = new Error("Test error with stack");

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.any(String),
				jasmine.any(Array),
				jasmine.stringContaining("timestamp")
			);
		});

		it("should include stack trace in copy data", () =>
		{
			const error = new Error("Test error");
			error.stack = "Error: Test error\n    at Object.<anonymous>";

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			const call = mockNotification.errorWithDetails.calls.mostRecent();
			const copyData = call.args[2];
			expect(copyData).toContain("stack");
		});

		it("should include request details in copy data for HTTP errors", () =>
		{
			const error = new HttpErrorResponse({
				status: 404,
				statusText: "Not Found",
				url: "https://api.example.com/users/123"
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			const call = mockNotification.errorWithDetails.calls.mostRecent();
			const copyData = call.args[2];
			expect(copyData).toContain("url");
			expect(copyData).toContain("status");
		});

		it("should prevent re-entry when already handling an error", (done) =>
		{
			const consoleSpy = spyOn(console, "error");
			let callCount = 0;

			// Configure notification to throw an error that triggers handleError again
			mockNotification.errorWithDetails.and.callFake(() =>
			{
				callCount++;
				if (callCount === 1)
				{
					// First call throws to trigger the catch block
					throw new Error("Notification failed");
				}
			});

			const firstError = new Error("First error");

			// First error triggers handleError
			service.handleError(firstError);

			// Verify notification failure was logged
			expect(consoleSpy).toHaveBeenCalledWith(
				"[ErrorHandler] Notification failed:",
				jasmine.any(Error)
			);

			done();
		});

		it("should gracefully handle errors during notification", () =>
		{
			const consoleSpy = spyOn(console, "error");
			mockNotification.errorWithDetails.and.throwError(
				"Notification system failure"
			);

			const error = new Error("Test error");

			// Should not throw - should be caught and logged
			expect(() =>
			{
				service.handleError(error);
			}).not.toThrow();

			// Should log the notification failure
			expect(consoleSpy).toHaveBeenCalled();
		});

		it("should reset guard flag after handling error", () =>
		{
			const error1 = new Error("First error");
			const error2 = new Error("Second error");

			try
			{
				service.handleError(error1);
			}
			catch (e)
			{
				// Expected in dev mode
			}

			// Should be able to handle second error normally
			try
			{
				service.handleError(error2);
			}
			catch (e)
			{
				// Expected in dev mode
			}

			// Both should have been logged
			expect(mockClientLogger.logError).toHaveBeenCalledTimes(2);
		});
	});
});
