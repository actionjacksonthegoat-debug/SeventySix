import { TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { ErrorHandlerService } from "./error-handler.service";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";
import { ClientErrorLoggerService } from "./client-error-logger.service";
import { createMockLogger, createMockNotificationService } from "@testing";
import {
	HttpError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError
} from "@infrastructure/models/errors";

describe("ErrorHandlerService", () =>
{
	let service: ErrorHandlerService;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockNotification: jasmine.SpyObj<NotificationService>;
	let mockClientLogger: jasmine.SpyObj<ClientErrorLoggerService>;
	let consoleErrorSpy: jasmine.Spy;

	beforeEach(() =>
	{
		consoleErrorSpy = spyOn(console, "error");

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
			try
			{
				service.handleError(new Error("Test error"));
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
			const error: HttpErrorResponse = new HttpErrorResponse({
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
			const error: HttpErrorResponse = new HttpErrorResponse({
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
			const error: HttpErrorResponse = new HttpErrorResponse({
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
			const error: ValidationError = new ValidationError(
				"Validation failed",
				{ field1: ["Error 1"] }
			);

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				"Error 1",
				jasmine.anything(),
				jasmine.any(String)
			);
		});

		it("should handle NotFoundError", () =>
		{
			const error: NotFoundError = new NotFoundError(
				"Resource not found"
			);

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
			const error: UnauthorizedError = new UnauthorizedError(
				"Not authorized"
			);

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
			const error: NetworkError = new NetworkError();

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
			const error: HttpError = new HttpError("Custom HTTP error", 418);

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
			try
			{
				service.handleError(new Error("Test error"));
			}
			catch (e)
			{
				// Expected in development mode
			}

			expect(mockClientLogger.logError).toHaveBeenCalled();
		});

		it("should log HTTP errors to ClientErrorLoggerService", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
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

	describe("copy data", () =>
	{
		it("should include timestamp in copy data", () =>
		{
			try
			{
				service.handleError(new Error("Test error"));
			}
			catch (e)
			{
				// Expected
			}

			const call: jasmine.CallInfo<
				typeof mockNotification.errorWithDetails
			> = mockNotification.errorWithDetails.calls.mostRecent();
			const copyData: string = call.args[2] as string;
			expect(copyData).toContain("timestamp");
		});

		it("should include stack trace in copy data", () =>
		{
			const error: Error = new Error("Test error");
			error.stack = "Error: Test error\n    at Object.<anonymous>";

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			const call: jasmine.CallInfo<
				typeof mockNotification.errorWithDetails
			> = mockNotification.errorWithDetails.calls.mostRecent();
			const copyData: string = call.args[2] as string;
			expect(copyData).toContain("stack");
		});

		it("should include request details in copy data for HTTP errors", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
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

			const call: jasmine.CallInfo<
				typeof mockNotification.errorWithDetails
			> = mockNotification.errorWithDetails.calls.mostRecent();
			const copyData: string = call.args[2] as string;
			expect(copyData).toContain("url");
			expect(copyData).toContain("status");
		});

		it("should include details in copy data", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
				status: 400,
				statusText: "Bad Request",
				url: "https://api.example.com/data",
				error: { errors: { email: ["Email is required"] } }
			});

			try
			{
				service.handleError(error);
			}
			catch (e)
			{
				// Expected
			}

			const call: jasmine.CallInfo<
				typeof mockNotification.errorWithDetails
			> = mockNotification.errorWithDetails.calls.mostRecent();
			const copyData: string = call.args[2] as string;
			expect(copyData).toContain("details");
		});
	});

	describe("errorWithDetails notifications", () =>
	{
		it("should show error with details for HTTP validation errors", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
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

		it("should include status and URL in details for HTTP errors", () =>
		{
			const error: HttpErrorResponse = new HttpErrorResponse({
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

			expect(mockNotification.errorWithDetails).toHaveBeenCalledWith(
				jasmine.any(String),
				jasmine.arrayContaining([
					jasmine.stringContaining("Status:"),
					jasmine.stringContaining("URL:")
				]),
				jasmine.any(String)
			);
		});
	});

	describe("re-entry protection", () =>
	{
		it("should prevent re-entry when already handling an error", () =>
		{
			let callCount: number = 0;

			mockNotification.errorWithDetails.and.callFake(() =>
			{
				callCount++;
				if (callCount === 1)
				{
					throw new Error("Notification failed");
				}
			});

			service.handleError(new Error("First error"));

			expect(consoleErrorSpy).toHaveBeenCalledWith(
				"[ErrorHandler] Failed:",
				jasmine.any(Error)
			);
		});

		it("should gracefully handle errors during notification", () =>
		{
			mockNotification.errorWithDetails.and.throwError(
				"Notification system failure"
			);

			expect(() =>
			{
				service.handleError(new Error("Test error"));
			}).not.toThrow();

			expect(consoleErrorSpy).toHaveBeenCalled();
		});

		it("should reset guard flag after handling error", () =>
		{
			try
			{
				service.handleError(new Error("First error"));
			}
			catch (e)
			{
				// Expected in dev mode
			}

			try
			{
				service.handleError(new Error("Second error"));
			}
			catch (e)
			{
				// Expected in dev mode
			}

			expect(mockClientLogger.logError).toHaveBeenCalledTimes(2);
		});
	});
});
