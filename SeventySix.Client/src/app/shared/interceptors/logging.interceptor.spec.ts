import { HttpRequest, HttpResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { LoggerService } from "@shared/services/logger.service";
import { firstValueFrom, of, throwError } from "rxjs";
import { type Mock, vi } from "vitest";
import { loggingInterceptor } from "./logging.interceptor";

interface MockHttpHandler
{
	handle: Mock;
}

describe("loggingInterceptor",
	() =>
	{
		let mockHandler: MockHttpHandler;
		let loggerSpy: { debug: Mock; error: Mock; };

		beforeEach(
			() =>
			{
				mockHandler =
					{
						handle: vi.fn()
					};
				mockHandler.handle.mockReturnValue(
					of(
						new HttpResponse(
							{ status: 200 })));

				loggerSpy =
					{
						debug: vi.fn(),
						error: vi.fn()
					};

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							{
								provide: LoggerService,
								useValue: loggerSpy
							}
						]
					});
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should log HTTP requests via LoggerService",
			async () =>
			{
				const req: HttpRequest<unknown> =
					new HttpRequest<unknown>("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						await firstValueFrom(
							loggingInterceptor(
								req,
								mockHandler.handle.bind(mockHandler)));
						expect(loggerSpy.debug)
							.toHaveBeenCalledWith(
								expect.stringContaining("HTTP Request: GET /api/data"));
					});
			});

		it("should not call console.log directly",
			async () =>
			{
				const consoleSpy: Mock =
					vi
						.spyOn(console, "log")
						.mockImplementation(
							() =>
							{});

				const req: HttpRequest<unknown> =
					new HttpRequest<unknown>("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						await firstValueFrom(
							loggingInterceptor(
								req,
								mockHandler.handle.bind(mockHandler)));
						expect(consoleSpy)
							.not
							.toHaveBeenCalled();
					});
			});

		it("should pass through requests",
			async () =>
			{
				const req: HttpRequest<unknown> =
					new HttpRequest<unknown>("GET", "/api/data");

				await TestBed.runInInjectionContext(
					async () =>
					{
						await firstValueFrom(
							loggingInterceptor(
								req,
								mockHandler.handle.bind(mockHandler)));
						expect(mockHandler.handle)
							.toHaveBeenCalled();
					});
			});

		it("should skip logging and pass through requests when consoleLogLevel is warn",
			async () =>
			{
				const originalLevel: string =
					environment.logging.consoleLogLevel;
				environment.logging.consoleLogLevel = "warn";

				try
				{
					const req: HttpRequest<unknown> =
						new HttpRequest<unknown>("GET", "/api/data");

					await TestBed.runInInjectionContext(
						async () =>
						{
							await firstValueFrom(
								loggingInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
							expect(loggerSpy.debug)
								.not
								.toHaveBeenCalled();
							expect(mockHandler.handle)
								.toHaveBeenCalled();
						});
				}
				finally
				{
					environment.logging.consoleLogLevel = originalLevel;
				}
			});

		it("should log HTTP errors via LoggerService error method",
			async () =>
			{
				mockHandler.handle.mockReturnValue(
					throwError(
						() => new Error("Network failure")));

				const req: HttpRequest<unknown> =
					new HttpRequest<unknown>("POST", "/api/users");

				await TestBed.runInInjectionContext(
					async () =>
					{
						try
						{
							await firstValueFrom(
								loggingInterceptor(
									req,
									mockHandler.handle.bind(mockHandler)));
						}
						catch
						{
							// Expected: error observable
						}
						expect(loggerSpy.error)
							.toHaveBeenCalledWith(
								expect.stringContaining("HTTP Error: POST /api/users"),
								expect.any(Error));
					});
			});
	});