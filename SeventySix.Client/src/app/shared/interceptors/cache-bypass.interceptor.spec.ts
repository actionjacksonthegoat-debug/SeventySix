import {
	HttpContext,
	HttpEvent,
	HttpHandlerFn,
	HttpRequest,
	HttpResponse
} from "@angular/common/http";
import {
	HTTP_CACHE_NO_CACHE,
	HTTP_CACHE_NO_STORE,
	HTTP_HEADER_CACHE_CONTROL,
	HTTP_HEADER_PRAGMA
} from "@shared/constants";
import { Observable, of } from "rxjs";
import {
	cacheBypassInterceptor,
	FORCE_REFRESH
} from "./cache-bypass.interceptor";

describe("cacheBypassInterceptor",
	() =>
	{
		let mockNext: HttpHandlerFn;
		let capturedRequest: HttpRequest<unknown>;

		beforeEach(
			() =>
			{
				mockNext =
					(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> =>
					{
						capturedRequest = request;
						return of(
							new HttpResponse(
								{ status: 200 }));
					};
			});

		it("should add cache-busting headers when FORCE_REFRESH is true",
			() =>
			{
				// Arrange
				const context: HttpContext =
					new HttpContext()
						.set(
							FORCE_REFRESH,
							true);
				const request: HttpRequest<unknown> =
					new HttpRequest(
						"GET",
						"/api/test",
						{ context });

				// Act
				cacheBypassInterceptor(
					request,
					mockNext);

				// Assert
				expect(capturedRequest.headers.get(HTTP_HEADER_CACHE_CONTROL))
					.toBe(HTTP_CACHE_NO_STORE);
				expect(capturedRequest.headers.get(HTTP_HEADER_PRAGMA))
					.toBe(HTTP_CACHE_NO_CACHE);
			});

		it("should not modify request when FORCE_REFRESH is false",
			() =>
			{
				// Arrange
				const context: HttpContext =
					new HttpContext()
						.set(
							FORCE_REFRESH,
							false);
				const request: HttpRequest<unknown> =
					new HttpRequest(
						"GET",
						"/api/test",
						{ context });

				// Act
				cacheBypassInterceptor(
					request,
					mockNext);

				// Assert
				expect(capturedRequest.headers.has(HTTP_HEADER_CACHE_CONTROL))
					.toBe(false);
				expect(capturedRequest.headers.has(HTTP_HEADER_PRAGMA))
					.toBe(false);
			});

		it("should not modify request when FORCE_REFRESH context is not set",
			() =>
			{
				// Arrange
				const request: HttpRequest<unknown> =
					new HttpRequest(
						"GET",
						"/api/test");

				// Act
				cacheBypassInterceptor(
					request,
					mockNext);

				// Assert - default is false, so no headers should be added
				expect(capturedRequest.headers.has(HTTP_HEADER_CACHE_CONTROL))
					.toBe(false);
				expect(capturedRequest.headers.has(HTTP_HEADER_PRAGMA))
					.toBe(false);
			});
	});