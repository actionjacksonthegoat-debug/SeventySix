import { TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { ErrorHandlerService } from "./error-handler.service";
import { LoggerService } from "./logger.service";
import { NotificationService } from "./notification.service";
import {
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	NetworkError,
	HttpError
} from "../models/errors";

describe("ErrorHandlerService", () =>
{
	let service: ErrorHandlerService;
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockNotification: jasmine.SpyObj<NotificationService>;

	beforeEach(() =>
	{
		mockLogger = jasmine.createSpyObj("LoggerService", [
			"error",
			"warning",
			"info"
		]);
		mockNotification = jasmine.createSpyObj("NotificationService", [
			"error",
			"warning",
			"success"
		]);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				ErrorHandlerService,
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: NotificationService, useValue: mockNotification }
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

			expect(mockLogger.error).toHaveBeenCalled();
			expect(mockNotification.error).toHaveBeenCalled();
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				jasmine.stringContaining("not found")
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				jasmine.stringContaining("session")
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				jasmine.stringContaining("Server error")
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

			expect(mockNotification.error).toHaveBeenCalled();
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				"Resource not found"
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				"Not authorized"
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				jasmine.stringContaining("Network error")
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

			expect(mockNotification.error).toHaveBeenCalledWith(
				"Custom HTTP error"
			);
		});
	});
});
