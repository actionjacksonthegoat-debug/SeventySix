import { HttpHandler, HttpRequest, HttpResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { loggingInterceptor } from "./logging.interceptor";

describe("loggingInterceptor", () =>
{
	let mockHandler: jasmine.SpyObj<HttpHandler>;

	beforeEach(() =>
	{
		mockHandler =
			jasmine.createSpyObj("HttpHandler", ["handle"]);
		mockHandler.handle.and.returnValue(
			of(new HttpResponse({ status: 200 })));

		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});

		spyOn(console, "log");
	});

	it("should log HTTP requests in development", (done: DoneFn) =>
	{
		const req: HttpRequest<unknown> =
			new HttpRequest<unknown>("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			loggingInterceptor(
				req,
				mockHandler.handle.bind(mockHandler))
				.subscribe((): void =>
				{
					// eslint-disable-next-line no-console
					expect(console.log)
						.toHaveBeenCalled();
					done();
				});
		});
	});

	it("should pass through requests", (done: DoneFn) =>
	{
		const req: HttpRequest<unknown> =
			new HttpRequest<unknown>("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			loggingInterceptor(
				req,
				mockHandler.handle.bind(mockHandler))
				.subscribe((): void =>
				{
					expect(mockHandler.handle)
						.toHaveBeenCalled();
					done();
				});
		});
	});
});
