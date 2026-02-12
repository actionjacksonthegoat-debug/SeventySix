// <copyright file="token-storage-security.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";

/**
 * Token Storage Security Tests
 *
 * Security Architecture:
 * 1. Access tokens stored in MEMORY ONLY (not localStorage/sessionStorage) - XSS protection
 * 2. Refresh tokens stored in HTTP-only cookies by the server - not accessible to JS
 * 3. Only a session marker (auth_has_session) stored in localStorage - indicates session exists
 *
 * Attack Vectors Tested:
 * - XSS attacks cannot steal access tokens from localStorage/sessionStorage
 * - Session marker alone is worthless without valid HTTP-only refresh cookie
 * - Clear separation between client state (marker) and secure tokens
 */
describe("Token Storage Security",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;
		let queryClient: QueryClient;

		/** Session marker key used by AuthService */
		const SESSION_KEY: string = "auth_has_session";

		beforeEach(
			() =>
			{
				localStorage.clear();
				sessionStorage.clear();

				queryClient =
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
				// Flush any pending profile fetch requests from invalidatePostLogin()
				httpMock
					.match(`${environment.apiUrl}/auth/me`)
					.forEach(
						(request: TestRequest) =>
							request.flush(null));
				httpMock.verify();
				localStorage.clear();
				sessionStorage.clear();
			});

		describe("Access Token Security (XSS Protection)",
			() =>
			{
				it("should NOT store access token in localStorage after login",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						// Verify access token is NOT in localStorage
						const localStorageKeys: string[] =
							Object.keys(localStorage);
						const hasAccessToken: boolean =
							localStorageKeys.some(
								(key: string) =>
									key
										.toLowerCase()
										.includes("accesstoken")
										|| key
											.toLowerCase()
											.includes("access_token")
										|| key
											.toLowerCase()
											.includes("token"));

						// Session marker is OK, but no actual tokens
						expect(hasAccessToken || localStorage.getItem("accessToken") !== null)
							.toBe(false);
					});

				it("should NOT store access token in sessionStorage after login",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						// Verify access token is NOT in sessionStorage
						const sessionStorageKeys: string[] =
							Object.keys(sessionStorage);
						const hasAccessToken: boolean =
							sessionStorageKeys.some(
								(key: string) =>
									key
										.toLowerCase()
										.includes("accesstoken")
										|| key
											.toLowerCase()
											.includes("access_token")
										|| key
											.toLowerCase()
											.includes("token"));

						expect(hasAccessToken || sessionStorage.getItem("accessToken") !== null)
							.toBe(false);
					});

				it("should only store session marker (not tokens) in localStorage",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						// Only the session marker should be stored
						const localStorageKeys: string[] =
							Object.keys(localStorage);

						// Should have exactly the session marker
						expect(localStorageKeys)
							.toContain(SESSION_KEY);
						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");

						// Session marker value should NOT contain any token data
						const sessionMarkerValue: string | null =
							localStorage.getItem(SESSION_KEY);
						expect(sessionMarkerValue)
							.not
							.toContain(mockResponse.accessToken);
					});
			});

		describe("Session Marker Isolation",
			() =>
			{
				it("should clear session marker on logout",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						// Login first
						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const loginReq: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						loginReq.flush(mockResponse);

						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");

						// Logout
						service.logout();

						const logoutReq: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
						logoutReq.flush({});

						// Session marker should be cleared
						expect(localStorage.getItem(SESSION_KEY))
							.toBeNull();
					});

				it("should clear session marker on forceLogoutLocally",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						// Login first
						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const loginReq: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						loginReq.flush(mockResponse);

						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");

						// Force local logout
						service.forceLogoutLocally();

						// Session marker should be cleared
						expect(localStorage.getItem(SESSION_KEY))
							.toBeNull();
					});
			});

		describe("No Sensitive Data Exposure",
			() =>
			{
				it("should not expose access token through window object",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						// Verify no global token exposure
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const windowAny: any = window;
						const hasGlobalToken: boolean =
							windowAny.accessToken !== undefined
								|| windowAny.token !== undefined
								|| windowAny.authToken !== undefined;

						expect(hasGlobalToken)
							.toBe(false);
					});

				it("should have authentication state only in memory signals",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						// Before login - no auth state
						expect(service.isAuthenticated())
							.toBe(false);
						expect(service.user())
							.toBeNull();

						// Login
						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						// After login - state in memory only
						expect(service.isAuthenticated())
							.toBe(true);
						expect(service.user())
							.not
							.toBeNull();

						// But NOT in storage
						expect(sessionStorage.getItem("user"))
							.toBeNull();
						expect(localStorage.getItem("user"))
							.toBeNull();
					});
			});
	});
