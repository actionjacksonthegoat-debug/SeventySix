import { TestBed } from "@angular/core/testing";
import { HttpRequest, HttpHandler, HttpResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { of } from "rxjs";
import { loggingInterceptor } from "./logging.interceptor";

describe("loggingInterceptor", () =>
{
	let mockHandler: jasmine.SpyObj<HttpHandler>;

	beforeEach(() =>
	{
		mockHandler = jasmine.createSpyObj("HttpHandler", ["handle"]);
		mockHandler.handle.and.returnValue(
			of(new HttpResponse({ status: 200 }))
		);

		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection()]
		});

		spyOn(console, "log");
	});

	it("should log HTTP requests in development", (done) =>
	{
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			loggingInterceptor(
				req,
				mockHandler.handle.bind(mockHandler)
			).subscribe(() =>
			{
				expect(console.log).toHaveBeenCalled();
				done();
			});
		});
	});

	it("should pass through requests", (done) =>
	{
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			loggingInterceptor(
				req,
				mockHandler.handle.bind(mockHandler)
			).subscribe(() =>
			{
				expect(mockHandler.handle).toHaveBeenCalled();
				done();
			});
		});
	});
});
