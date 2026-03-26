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

const SESSION_KEY: string = "auth_has_session";

function createTestBed(): { authService: AuthService; httpMock: HttpTestingController; }
{
	const testQueryClient: QueryClient =
		createTestQueryClient();
	TestBed.resetTestingModule();
	TestBed.configureTestingModule(
		{
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
				provideRouter([]),
				provideTanStackQuery(testQueryClient),
				{ provide: PLATFORM_ID, useValue: "browser" },
				{
					provide: WindowService,
					useValue: {
						openWindow: () => undefined,
						navigateTo: () => undefined,
						reload: () => undefined,
						getCurrentUrl: () => "https://localhost:4200",
						getPathname: () => "/",
						getViewportHeight: () => 768,
						getViewportWidth: () => 1024,
						scrollToTop: () => undefined,
						getHash: () => "",
						getSearch: () => "",
						replaceState: () => undefined
					}
				},
				AuthService
			]
		});

	return {
		authService: TestBed.inject(AuthService),
		httpMock: TestBed.inject(HttpTestingController)
	};
}

describe("AuthService branch coverage",
	() =>
	{
		afterEach(
			() =>
			{
				localStorage.removeItem(SESSION_KEY);
			});

		it("should skip token handling when login response requires MFA",
			() =>
			{
				const { authService, httpMock } =
					createTestBed();
				const response: AuthResponse =
					createMockAuthResponse(
						{},
						{ requiresMfa: true, requiresPasswordChange: true });

				authService
					.login(
						{
							usernameOrEmail: "testuser",
							password: "Password123",
							rememberMe: false
						})
					.subscribe();

				const req: TestRequest =
					httpMock.expectOne(`${environment.apiUrl}/auth/login`);
				req.flush(response);

				expect(authService.isAuthenticated())
					.toBe(false);
				expect(authService.getAccessToken())
					.toBeNull();
				expect(localStorage.getItem(SESSION_KEY))
					.toBeNull();
				expect(authService.requiresPasswordChange())
					.toBe(false);

				httpMock.verify();
			});

		it("should restore session when refresh succeeds during initialize",
			() =>
			{
				localStorage.setItem(SESSION_KEY, "true");
				const { authService, httpMock } =
					createTestBed();
				let result: AuthResponse | null | undefined;

				authService
					.initialize()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							result = response;
						});

				const req: TestRequest =
					httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
				const response: AuthResponse =
					createMockAuthResponse();
				req.flush(response);

				expect(result?.accessToken)
					.toBe(response.accessToken);
				expect(authService.isAuthenticated())
					.toBe(true);

				httpMock.verify();
			});

		it("should share a single in-flight refresh request across subscribers",
			() =>
			{
				const { authService, httpMock } =
					createTestBed();
				const results: Array<AuthResponse | null> = [];

				authService
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							results.push(response);
						});
				authService
					.refreshToken()
					.subscribe(
						(response: AuthResponse | null) =>
						{
							results.push(response);
						});

				const req: TestRequest =
					httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
				req.flush(createMockAuthResponse());

				expect(results.length)
					.toBe(2);
				httpMock.verify();
			});

		it("should retry transient refresh failures before succeeding",
			async () =>
			{
				vi.useFakeTimers();

				try
				{
					const { authService, httpMock } =
						createTestBed();
					let result: AuthResponse | null | undefined;

					authService
						.refreshToken()
						.subscribe(
							(response: AuthResponse | null) =>
							{
								result = response;
							});

					const firstRequest: TestRequest =
						httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
					firstRequest.flush(
						{ error: "temporary outage" },
						{ status: 503, statusText: "Service Unavailable" });

					await vi.advanceTimersByTimeAsync(2000);

					const secondRequest: TestRequest =
						httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
					const response: AuthResponse =
						createMockAuthResponse();
					secondRequest.flush(response);

					expect(result?.accessToken)
						.toBe(response.accessToken);
					httpMock.verify();
				}
				finally
				{
					vi.useRealTimers();
				}
			});
	});