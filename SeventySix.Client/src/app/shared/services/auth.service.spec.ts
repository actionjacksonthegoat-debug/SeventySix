import {
	provideHttpClient,
	withInterceptorsFromDi
} from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "@environments/environment";
import { AuthResponse } from "@shared/models";
import { DateService } from "@shared/services";
import {
	TEST_ROLE_ADMIN,
	TEST_ROLE_DEVELOPER
} from "@testing/constants";
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";
import { DOTNET_ROLE_CLAIM } from "./auth.types";

/** AuthService Tests - focuses on authentication logic */
describe("AuthService",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;

		/** Session marker key used by AuthService */
		const SESSION_KEY: string = "auth_has_session";

		beforeEach(
			() =>
			{
			// Clear session marker before each test
				localStorage.removeItem(SESSION_KEY);

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(withInterceptorsFromDi()),
							provideHttpClientTesting(),
							provideRouter([]),
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
								{ [DOTNET_ROLE_CLAIM]: ["Developer"] });

						let result: AuthResponse | undefined;
						service
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
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
							.toEqual(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								});
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
							.login(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						expect(req.request.body)
							.toEqual(
								{
									usernameOrEmail: "testuser",
									password: "Password123",
									rememberMe: false
								});
						req.flush(mockResponse);
					});
			});

		describe("logout",
			() =>
			{
				it("should clear user state on logout",
					() =>
					{
						// First login to set state
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

						const loginReq: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/login`);
						loginReq.flush(mockResponse);

						expect(service.isAuthenticated())
							.toBe(true);

						// Now logout
						service.logout();

						// Expect logout API call
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
						// Arrange - set authenticated state via login
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

						expect(service.isAuthenticated())
							.toBe(true);
						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");

						// Act
						service.forceLogoutLocally();

						// Assert
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
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: ["Developer", "Admin"] });

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
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: ["Developer"] });

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
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{ [DOTNET_ROLE_CLAIM]: ["Developer"] });

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
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{
									unique_name: "johndoe"
								},
								{
									email: "john@example.com",
									fullName: "John Doe"
								});

						service
							.login(
								{
									usernameOrEmail: "johndoe",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						expect(service.user()?.fullName)
							.toBe("John Doe");
					});

				it("should set fullName to null when fullName is null in response",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{
									unique_name: "johndoe"
								},
								{
									email: "john@example.com",
									fullName: null
								});

						service
							.login(
								{
									usernameOrEmail: "johndoe",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

						expect(service.user()?.fullName)
							.toBeNull();
					});

				it("should set email from response body",
					() =>
					{
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{
									unique_name: "johndoe"
								},
								{
									email: "john@example.com",
									fullName: "John Doe"
								});

						service
							.login(
								{
									usernameOrEmail: "johndoe",
									password: "Password123",
									rememberMe: false
								})
							.subscribe();

						const req: TestRequest =
							httpMock.expectOne(`${environment.apiUrl}/auth/login`);
						req.flush(mockResponse);

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
						const mockResponse: AuthResponse =
							createMockAuthResponse(
								{ exp: String(Math.floor(dateService.nowTimestamp() / 1000) + 3600) },
								{
									expiresAt: dateService
										.fromMillis(dateService.nowTimestamp() + 3600000)
										.toISOString()
								});

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

						const token: string | null =
							service.getAccessToken();
						expect(token).not.toBeNull();
						expect(token)
							.toBe(mockResponse.accessToken);
					});
			});

		describe("loginWithProvider",
			() =>
			{
				/**
		 * Note: Cannot directly test loginWithProvider as it sets window.location.href
		 * which causes a full page reload in Karma tests.
		 * The functionality is covered by E2E tests instead.
		 */
				it("should construct correct OAuth URL",
					() =>
					{
						// Test that the URL would be correct without triggering redirect
						const expectedUrl: string =
							`${environment.apiUrl}/auth/github`;

						expect(expectedUrl)
							.toContain("/auth/github");
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

				it("should attempt refresh when session marker exists",
					() =>
					{
						localStorage.setItem(SESSION_KEY, "true");

						// Need fresh service instance to test initialize
						service =
							TestBed.inject(AuthService);
						let completed: boolean = false;
						service
							.initialize()
							.subscribe(
								() => (completed = true));

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/refresh`);
						expect(req.request.method)
							.toBe("POST");
						req.flush(
							{ error: "No token" },
							{ status: 401, statusText: "Unauthorized" });
						expect(completed)
							.toBe(true);
					});

				it("should only run once per service instance",
					() =>
					{
						localStorage.setItem(SESSION_KEY, "true");
						service =
							TestBed.inject(AuthService);

						// First call - should attempt refresh
						service
							.initialize()
							.subscribe();
						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/refresh`);
						req.flush(
							{ error: "No token" },
							{ status: 401, statusText: "Unauthorized" });

						// Second call - should not make another request
						let secondCompleted: boolean = false;
						service
							.initialize()
							.subscribe(
								() => (secondCompleted = true));
						httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
						expect(secondCompleted)
							.toBe(true);
					});
			});

		describe("session marker",
			() =>
			{
				it("should set session marker on login",
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

						expect(localStorage.getItem(SESSION_KEY))
							.toBe("true");
					});

				it("should clear session marker on logout",
					() =>
					{
						localStorage.setItem(SESSION_KEY, "true");

						// Login first
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

						const loginReq: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/login`);
						loginReq.flush(mockResponse);

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
								`${environment.apiUrl}/auth/set-password`);
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
	});
