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
import { DateService } from "@shared/services";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import {
	TEST_ROLE_ADMIN,
	TEST_ROLE_DEVELOPER
} from "@testing/constants";
import { Mock, vi } from "vitest";
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";
import { DOTNET_ROLE_CLAIM } from "./auth.types";
import { WindowService } from "./window.service";

/** Mock WindowService for controlling popup and navigation behavior */
interface MockWindowService
{
	openWindow: Mock;
	navigateTo: Mock;
	reload: Mock;
	getCurrentUrl: Mock;
	getPathname: Mock;
	getViewportHeight: Mock;
	getViewportWidth: Mock;
	scrollToTop: Mock;
	getHash: Mock;
	getSearch: Mock;
	replaceState: Mock;
}

function createMockWindowService(): MockWindowService
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

/** Session marker key used by AuthService */
const SESSION_KEY: string = "auth_has_session";

/** Default login credentials for test cases */
const TEST_LOGIN: { usernameOrEmail: string; password: string; rememberMe: boolean; } =
	{
		usernameOrEmail: "testuser",
		password: "Password123",
		rememberMe: false
	};

/** Logs in and flushes the HTTP request. Returns the flushed response. */
function loginAndFlush(
	svc: AuthService,
	mock: HttpTestingController,
	response?: AuthResponse): AuthResponse
{
	const mockResponse: AuthResponse =
		response ?? createMockAuthResponse();
	svc
		.login(TEST_LOGIN)
		.subscribe();
	const req: TestRequest =
		mock.expectOne(`${environment.apiUrl}/auth/login`);
	req.flush(mockResponse);
	return mockResponse;
}

/** Creates a fresh TestBed with AuthService. Call AFTER setting localStorage to test initialize() behavior. */
function createFreshTestBed(): { authService: AuthService; httpMock: HttpTestingController; queryClient: QueryClient; }
{
	TestBed.resetTestingModule();
	const testQueryClient: QueryClient =
		createTestQueryClient();
	TestBed.configureTestingModule(
		{
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
				provideRouter([]),
				provideTanStackQuery(testQueryClient),
				{ provide: PLATFORM_ID, useValue: "browser" },
				{ provide: WindowService, useValue: createMockWindowService() },
				AuthService
			]
		});
	return {
		authService: TestBed.inject(AuthService),
		httpMock: TestBed.inject(HttpTestingController),
		queryClient: testQueryClient
	};
}

/** AuthService Tests - focuses on authentication logic */
describe("AuthService",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;
		let queryClient: QueryClient;
		let mockWindowService: MockWindowService;

		beforeEach(
			() =>
			{
				localStorage.removeItem(SESSION_KEY);

				queryClient =
					createTestQueryClient();
				mockWindowService =
					createMockWindowService();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							provideRouter([]),
							provideTanStackQuery(queryClient),
							{ provide: PLATFORM_ID, useValue: "browser" },
							{ provide: WindowService, useValue: mockWindowService },
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
				localStorage.removeItem(SESSION_KEY);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("login",
			() =>
			{
				it("should login with credentials and set user state",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: [TEST_ROLE_DEVELOPER] });

						let result: AuthResponse | undefined;
						service
							.login(TEST_LOGIN)
							.subscribe(
								(response: AuthResponse) =>
								{
									result = response;
								});

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body)
							.toEqual(TEST_LOGIN);
						req.flush(mockResponse);

						expect(result)
							.toBeDefined();
						expect(result?.accessToken)
							.toBe(mockResponse.accessToken);
						expect(service.isAuthenticated())
							.toBe(true);
					});

				it("should not set user on login failure",
					() =>
					{
						service
							.login(
								{
									usernameOrEmail: "invalid",
									password: "wrong",
									rememberMe: false
								})
							.subscribe(
								{
									error: () =>
									{
										// Expected error
									}
								});

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(
							{ error: "Invalid credentials" },
							{ status: 401, statusText: "Unauthorized" });

						expect(service.isAuthenticated())
							.toBe(false);
					});

				it("should include rememberMe in login request when true",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: true
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						expect(req.request.body)
							.toEqual(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: true
								});
						req.flush(mockResponse);
					});

				it("should include rememberMe in login request when false",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse();

						service
							.login(TEST_LOGIN)
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						expect(req.request.body)
							.toEqual(TEST_LOGIN);
						req.flush(mockResponse);
					});
			});

		describe("logout",
			() =>
			{
				it("should clear user state on logout",
					() =>
					{
						loginAndFlush(service, httpMock);

						expect(service.isAuthenticated())
							.toBe(true);

						service.logout();

						const logoutReq: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/logout`);
						logoutReq.flush({});

						expect(service.isAuthenticated())
							.toBe(false);
						expect(service.user())
							.toBeNull();
					});
			});

		describe("forceLogoutLocally",
			() =>
			{
				it("should clear all local authentication state",
					() =>
					{
						loginAndFlush(service, httpMock);

						expect(service.isAuthenticated())
							.toBe(true);
						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");

						service.forceLogoutLocally();

						expect(service.isAuthenticated())
							.toBe(false);
						expect(service.user())
							.toBeNull();
						expect(localStorage.getItem(SESSION_KEY))
							.toBeNull();
					});
			});

		describe("hasRole",
			() =>
			{
				it("should correctly check user role",
					() =>
					{
						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: [TEST_ROLE_DEVELOPER, TEST_ROLE_ADMIN] }));

						expect(service.hasRole(TEST_ROLE_DEVELOPER))
							.toBe(true);
						expect(service.hasRole(TEST_ROLE_ADMIN))
							.toBe(true);
						expect(service.hasRole("SuperAdmin"))
							.toBe(false);
					});

				it("should handle single role as string",
					() =>
					{
						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: [TEST_ROLE_DEVELOPER] }));

						expect(service.hasRole(TEST_ROLE_DEVELOPER))
							.toBe(true);
						expect(service.hasRole(TEST_ROLE_ADMIN))
							.toBe(false);
					});
			});

		describe("hasAnyRole",
			() =>
			{
				it("should return true if user has any of the specified roles",
					() =>
					{
						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: [TEST_ROLE_DEVELOPER] }));

						expect(service.hasAnyRole(TEST_ROLE_DEVELOPER, TEST_ROLE_ADMIN))
							.toBe(true);
						expect(service.hasAnyRole(TEST_ROLE_ADMIN, "SuperAdmin"))
							.toBe(false);
					});
			});

		describe("fullName parsing",
			() =>
			{
				it("should set fullName from response body",
					() =>
					{
						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ unique_name: "johndoe" },
								{ email: "john@example.com", fullName: "John Doe" }));

						expect(service.user()?.fullName)
							.toBe("John Doe");
					});

				it("should set fullName to null when fullName is null in response",
					() =>
					{
						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ unique_name: "johndoe" },
								{ email: "john@example.com", fullName: null }));

						expect(service.user()?.fullName)
							.toBeNull();
					});

				it("should set email from response body",
					() =>
					{
						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ unique_name: "johndoe" },
								{ email: "john@example.com", fullName: "John Doe" }));

						expect(service.user()?.email)
							.toBe("john@example.com");
					});
			});

		describe("refreshToken",
			() =>
			{
				it("should refresh tokens successfully",
					() =>
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

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/refresh`);
						expect(req.request.method)
							.toBe("POST");
						req.flush(mockResponse);

						expect(result).not.toBeNull();
						const authResult: AuthResponse =
							result!;
						expect(authResult.accessToken)
							.toBe(mockResponse.accessToken);
					});

				it("should return null on refresh failure",
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
							httpMock.expectOne(
								`${environment.apiUrl}/auth/refresh`);
						req.flush(
							{ error: "Token expired" },
							{ status: 401, statusText: "Unauthorized" });

						expect(result)
							.toBeNull();
					});
			});

		describe("isTokenExpired",
			() =>
			{
				it("should return true when not authenticated",
					() =>
					{
						expect(service.isTokenExpired())
							.toBe(true);
					});

				it("should return false for valid token",
					() =>
					{
						const dateService: DateService =
							new DateService();

						loginAndFlush(
							service,
							httpMock,
							createMockAuthResponse(
								{ exp: String(Math.floor(dateService.nowTimestamp() / 1000) + 3600) },
								{
									expiresAt: dateService
										.fromMillis(dateService.nowTimestamp() + 3600000)
										.toISOString()
								}));

						expect(service.isTokenExpired())
							.toBe(false);
					});
			});

		describe("getAccessToken",
			() =>
			{
				it("should return null when not authenticated",
					() =>
					{
						expect(service.getAccessToken())
							.toBeNull();
					});

				it("should return token when authenticated",
					() =>
					{
						const mockResponse: AuthResponse =
							loginAndFlush(service, httpMock);

						const token: string | null =
							service.getAccessToken();
						expect(token).not.toBeNull();
						expect(token)
							.toBe(mockResponse.accessToken);
					});
			});

		describe("initialize",
			() =>
			{
				it("should not attempt refresh without existing session",
					() =>
					{
						let completed: boolean = false;
						service
							.initialize()
							.subscribe(
								() => (completed = true));

						// No HTTP request should be made
						httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
						expect(completed)
							.toBe(true);
					});

				it("should attempt refresh when session marker exists Async",
					async () =>
					{
						localStorage.setItem(SESSION_KEY, "true");
						const { authService, httpMock } =
							createFreshTestBed();

						let completed: boolean = false;
						authService
							.initialize()
							.subscribe(
								() => (completed = true));

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
						expect(req.request.method)
							.toBe("POST");
						req.flush(
							{ error: "No token" },
							{ status: 401, statusText: "Unauthorized" });
						expect(completed)
							.toBe(true);

						httpMock.verify();
					});

				it("should only run once per service instance Async",
					async () =>
					{
						localStorage.setItem(SESSION_KEY, "true");
						const { authService, httpMock } =
							createFreshTestBed();

						// First call - should attempt refresh
						authService
							.initialize()
							.subscribe();
						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
						req.flush(
							{ error: "No token" },
							{ status: 401, statusText: "Unauthorized" });

						// Second call - should not make another request
						let secondCompleted: boolean = false;
						authService
							.initialize()
							.subscribe(
								() => (secondCompleted = true));
						httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
						expect(secondCompleted)
							.toBe(true);

						httpMock.verify();
					});
			});

		describe("session marker",
			() =>
			{
				it("should set session marker on login",
					() =>
					{
						loginAndFlush(service, httpMock);

						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");
					});

				it("should clear session marker on logout",
					() =>
					{
						localStorage.setItem(SESSION_KEY, "true");

						loginAndFlush(service, httpMock);

						// Logout
						service.logout();
						const logoutReq: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/logout`);
						logoutReq.flush({});

						expect(localStorage.getItem(SESSION_KEY))
							.toBeNull();
					});
			});

		describe("setPassword",
			() =>
			{
				it("should call set password endpoint with token and new password",
					() =>
					{
						const token: string = "valid-reset-token";
						const newPassword: string = "NewPassword123!";

						let completed: boolean = false;
						service
							.setPassword(token, newPassword)
							.subscribe(
								() =>
								{
									completed = true;
								});

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/password/set`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body)
							.toEqual(
								{
									token,
									newPassword
								});
						req.flush(null);

						expect(completed)
							.toBe(true);
					});
			});

		describe("cross-tab logout",
			() =>
			{
				it("should call forceLogoutLocally when auth_has_session removed in another tab",
					() =>
					{
						service
							.initialize()
							.subscribe();
						loginAndFlush(service, httpMock);

						expect(service.isAuthenticated())
							.toBe(true);

						// Simulate StorageEvent from another tab (session marker removed)
						const storageEvent: StorageEvent =
							new StorageEvent(
								"storage",
								{
									key: SESSION_KEY,
									newValue: null,
									oldValue: "true"
								});
						window.dispatchEvent(storageEvent);

						expect(service.isAuthenticated())
							.toBe(false);
					});

				it("should not trigger logout for unrelated storage events",
					() =>
					{
						service
							.initialize()
							.subscribe();
						loginAndFlush(service, httpMock);

						// Simulate unrelated storage event
						const storageEvent: StorageEvent =
							new StorageEvent(
								"storage",
								{
									key: "unrelated_key",
									newValue: null
								});
						window.dispatchEvent(storageEvent);

						expect(service.isAuthenticated())
							.toBe(true);
					});

				it("should not trigger logout when new value is set",
					() =>
					{
						service
							.initialize()
							.subscribe();
						loginAndFlush(service, httpMock);

						// Simulate session marker being SET (not removed)
						const storageEvent: StorageEvent =
							new StorageEvent(
								"storage",
								{
									key: SESSION_KEY,
									newValue: "true",
									oldValue: null
								});
						window.dispatchEvent(storageEvent);

						expect(service.isAuthenticated())
							.toBe(true);
					});
			});
	});
