import { TestBed } from "@angular/core/testing";
import {
	HttpRequest,
	HttpHandler,
	HttpErrorResponse
} from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { throwError } from "rxjs";
import { errorInterceptor } from "./error.interceptor";
import { createMockLogger } from "@testing";
import { LoggerService } from "@core/services/logger.service";
import {
	NetworkError,
	ValidationError,
	NotFoundError
} from "@core/models/errors";

describe("errorInterceptor", () =>
{
	let mockLogger: jasmine.SpyObj<LoggerService>;
	let mockHandler: jasmine.SpyObj<HttpHandler>;

	beforeEach(() =>
	{
		mockLogger = createMockLogger();
		mockHandler = jasmine.createSpyObj("HttpHandler", ["handle"]);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: LoggerService, useValue: mockLogger }
			]
		});
	});

	it("should convert network errors (status 0)", (done) =>
	{
		const error = new HttpErrorResponse({ status: 0 });
		mockHandler.handle.and.returnValue(throwError(() => error));
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			errorInterceptor(
				req,
				mockHandler.handle.bind(mockHandler)
			).subscribe({
				error: (err) =>
				{
					expect(err instanceof NetworkError).toBe(true);
					done();
				}
			});
		});
	});

	it("should convert 404 errors to NotFoundError", (done) =>
	{
		const error = new HttpErrorResponse({ status: 404 });
		mockHandler.handle.and.returnValue(throwError(() => error));
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			errorInterceptor(
				req,
				mockHandler.handle.bind(mockHandler)
			).subscribe({
				error: (err) =>
				{
					expect(err instanceof NotFoundError).toBe(true);
					done();
				}
			});
		});
	});

	it("should convert validation errors", (done) =>
	{
		const error = new HttpErrorResponse({
			status: 400,
			error: { errors: { field: ["error"] } }
		});
		mockHandler.handle.and.returnValue(throwError(() => error));
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			errorInterceptor(
				req,
				mockHandler.handle.bind(mockHandler)
			).subscribe({
				error: (err) =>
				{
					expect(err instanceof ValidationError).toBe(true);
					done();
				}
			});
		});
	});
});
