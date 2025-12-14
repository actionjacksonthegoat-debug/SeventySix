import {
	HttpErrorResponse,
	HttpHandler,
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
} from "@infrastructure/models/errors";
import { AuthService } from "@infrastructure/services/auth.service";
import { LoggerService } from "@infrastructure/services/logger.service";
import { createMockLogger } from "@testing";
import { throwError } from "rxjs";
import { errorInterceptor } from "./error.interceptor";

describe("errorInterceptor",
	() =>
	{
		let mockLogger: jasmine.SpyObj<LoggerService>;
		let mockAuthService: jasmine.SpyObj<AuthService>;
		let mockHandler: jasmine.SpyObj<HttpHandler>;

		beforeEach(
			() =>
			{
				mockLogger =
					createMockLogger();
				mockAuthService =
					jasmine.createSpyObj("AuthService",
						[
							"isAuthenticated",
							"logout"
						]);
				mockHandler =
					jasmine.createSpyObj("HttpHandler",
						["handle"]);

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
			(done) =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 0 });
				mockHandler.handle.and.returnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				TestBed.runInInjectionContext(
					() =>
					{
						errorInterceptor(
							req,
							mockHandler.handle.bind(mockHandler))
						.subscribe(
							{
								error: (err: Error) =>
								{
									expect(err instanceof NetworkError)
									.toBe(true);
									done();
								}
							});
					});
			});

		it("should convert 404 errors to NotFoundError",
			(done) =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 404 });
				mockHandler.handle.and.returnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				TestBed.runInInjectionContext(
					() =>
					{
						errorInterceptor(
							req,
							mockHandler.handle.bind(mockHandler))
						.subscribe(
							{
								error: (err: Error) =>
								{
									expect(err instanceof NotFoundError)
									.toBe(true);
									done();
								}
							});
					});
			});

		it("should convert validation errors",
			(done) =>
			{
				const error: HttpErrorResponse =
					new HttpErrorResponse(
						{
							status: 400,
							error: { errors: { field: ["error"] } }
						});
				mockHandler.handle.and.returnValue(throwError(
					() => error));
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				TestBed.runInInjectionContext(
					() =>
					{
						errorInterceptor(
							req,
							mockHandler.handle.bind(mockHandler))
						.subscribe(
							{
								error: (err: Error) =>
								{
									expect(err instanceof ValidationError)
									.toBe(true);
									done();
								}
							});
					});
			});
	});
