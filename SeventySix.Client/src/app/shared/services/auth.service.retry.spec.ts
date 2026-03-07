import {
	provideHttpClient,
	withInterceptorsFromDi
} from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { PLATFORM_ID, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "@environments/environment";
import { AuthResponse } from "@shared/models";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { vi } from "vitest";
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";
import { WindowService } from "./window.service";

function createMockWindowService(): Record<string, ReturnType<typeof vi.fn>>
{
	return {
		openWindow: vi.fn(),
		navigateTo: vi.fn(),
		reload: vi.fn(),
		getCurrentUrl: vi
			.fn()
			.mockReturnValue("https://localhost:4200"),
		getPathname: vi
			.fn()
			.mockReturnValue("/"),
		getViewportHeight: vi
			.fn()
			.mockReturnValue(768),
		getViewportWidth: vi
			.fn()
			.mockReturnValue(1024),
		scrollToTop: vi.fn(),
		getHash: vi
			.fn()
			.mockReturnValue(""),
		getSearch: vi
			.fn()
			.mockReturnValue(""),
		replaceState: vi.fn()
	};
}

const REFRESH_URL: string =
	`${environment.apiUrl}/auth/refresh`;

describe("AuthService retry behavior",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;

		beforeEach(
			() =>
			{
				vi.useFakeTimers();
				localStorage.removeItem("auth_has_session");

				const queryClient: QueryClient =
					createTestQueryClient();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							provideRouter([]),
							provideTanStackQuery(queryClient),
							{ provide: PLATFORM_ID, useValue: "browser" },
							{ provide: WindowService, useValue: createMockWindowService() },
							AuthService
						]
					});

				service =
					TestBed.inject(AuthService);
				httpMock =
					TestBed.inject(HttpTestingController);
			});

		afterEach(
			() =>
			{
				httpMock
					.match(`${environment.apiUrl}/auth/me`)
					.forEach(
						(request: TestRequest) =>
							request.flush(null));
				httpMock.verify();
				localStorage.removeItem("auth_has_session");
				vi.useRealTimers();
			});

		it("should retry on 502 and succeed on subsequent attempt",
			async () =>
			{
				const mockResponse: AuthResponse =
					createMockAuthResponse();

				let result: AuthResponse | null = null;
				service
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							result = response;
						});

				const firstReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				firstReq.flush(
					null,
					{ status: 502, statusText: "Bad Gateway" });

				await vi.advanceTimersByTimeAsync(2000);

				const retryReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				retryReq.flush(mockResponse);

				expect(result).not.toBeNull();
				expect(result!.accessToken)
					.toBe(mockResponse.accessToken);
			});

		it("should retry on 503 and succeed on subsequent attempt",
			async () =>
			{
				const mockResponse: AuthResponse =
					createMockAuthResponse();

				let result: AuthResponse | null = null;
				service
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							result = response;
						});

				const firstReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				firstReq.flush(
					null,
					{ status: 503, statusText: "Service Unavailable" });

				await vi.advanceTimersByTimeAsync(2000);

				const retryReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				retryReq.flush(mockResponse);

				expect(result).not.toBeNull();
				expect(result!.accessToken)
					.toBe(mockResponse.accessToken);
			});

		it("should not retry on 401",
			() =>
			{
				let result: AuthResponse | null | undefined;
				service
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							result = response;
						});

				const req: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				req.flush(
					{ error: "Invalid token" },
					{ status: 401, statusText: "Unauthorized" });

				expect(result)
					.toBeNull();
				httpMock.expectNone(REFRESH_URL);
			});

		it("should not retry on 429",
			() =>
			{
				let result: AuthResponse | null | undefined;
				service
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							result = response;
						});

				const req: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				req.flush(
					null,
					{ status: 429, statusText: "Too Many Requests" });

				expect(result)
					.toBeNull();
				httpMock.expectNone(REFRESH_URL);
			});

		it("should return null after exhausting all retries on 502",
			async () =>
			{
				let result: AuthResponse | null | undefined;
				service
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							result = response;
						});

				const firstReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				firstReq.flush(
					null,
					{ status: 502, statusText: "Bad Gateway" });

				await vi.advanceTimersByTimeAsync(2000);

				const secondReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				secondReq.flush(
					null,
					{ status: 502, statusText: "Bad Gateway" });

				await vi.advanceTimersByTimeAsync(4000);

				const thirdReq: TestRequest =
					httpMock.expectOne(REFRESH_URL);
				thirdReq.flush(
					null,
					{ status: 502, statusText: "Bad Gateway" });

				expect(result)
					.toBeNull();
			});
	});