import {
	HttpErrorResponse,
	HttpRequest
} from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import {
	NetworkError,
	NotFoundError,
	ValidationError
} from "@shared/models";
import { AuthService } from "@shared/services/auth.service";
import { LoggerService } from "@shared/services/logger.service";
import {
	createMockLogger,
	type MockLoggerService
} from "@shared/testing";
import { firstValueFrom } from "rxjs";
import { throwError } from "rxjs";
import { type Mock, vi } from "vitest";
import { errorInterceptor } from "./error.interceptor";

interface MockAuthService
{
	isAuthenticated: Mock;
	logout: Mock;
}

interface MockHttpHandler
{
	handle: Mock;
}

describe("errorInterceptor",
	() =>
	{
		let mockLogger: MockLoggerService;
		let mockAuthService: MockAuthService;
		let mockHandler: MockHttpHandler;

		beforeEach(
			() =>
			{
				mockLogger =
					createMockLogger();
				mockAuthService =
					{
						isAuthenticated: vi.fn(),
						logout: vi.fn()
					};
				mockHandler =
					{
						handle: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(),
							provideHttpClientTesting(),
							provideRouter([]),
							{ provide: LoggerService, useValue: mockLogger },
							{ provide: AuthService, useValue: mockAuthService }
						]
					});
			});

		it("should convert network errors (status 0)",
			async () =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 0 });
				mockHandler.handle.mockReturnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								errorInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch (receivedError)
						{
							expect(receivedError instanceof NetworkError)
								.toBe(true);
						}
					});
			});

		it("should convert 404 errors to NotFoundError",
			async () =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 404 });
				mockHandler.handle.mockReturnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								errorInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch (receivedError)
						{
							expect(receivedError instanceof NotFoundError)
								.toBe(true);
						}
					});
			});

		it("should convert validation errors",
			async () =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{
							status: 400,
							error: { errors: { field: ["error"] } }
						});
				mockHandler.handle.mockReturnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								errorInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch (receivedError)
						{
							expect(receivedError instanceof ValidationError)
								.toBe(true);
						}
					});
			});
	});
