import {
	HttpContext,
	HttpEvent,
	HttpHandlerFn,
	HttpRequest,
	HttpResponse
} from "@angular/common/http";
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
				expect(capturedRequest.headers.get("Cache-Control"))
					.toBe("no-cache, no-store, must-revalidate");
				expect(capturedRequest.headers.get("Pragma"))
					.toBe("no-cache");
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
				expect(capturedRequest.headers.has("Cache-Control"))
					.toBe(false);
				expect(capturedRequest.headers.has("Pragma"))
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
				expect(capturedRequest.headers.has("Cache-Control"))
					.toBe(false);
				expect(capturedRequest.headers.has("Pragma"))
					.toBe(false);
			});
	});