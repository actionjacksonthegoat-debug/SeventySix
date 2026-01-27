import { HttpRequest, HttpResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
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

				TestBed.configureTestingModule(
					{
						providers: [provideZonelessChangeDetection()]
					});

				vi
					.spyOn(console, "log")
					.mockImplementation(
						() =>
						{});
			});

		afterEach(
			() =>
			{
				vi.restoreAllMocks();
			});

		it("should log HTTP requests in development",
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
						// eslint-disable-next-line no-console
						expect(console.log)
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
	});
