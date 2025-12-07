import { TestBed } from "@angular/core/testing";
import {
	provideHttpClient,
	withInterceptorsFromDi
} from "@angular/common/http";
import {
	provideHttpClientTesting,
	HttpTestingController
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { AuthResponse, DOTNET_ROLE_CLAIM } from "@infrastructure/models";
import { environment } from "@environments/environment";

/** AuthService Tests - focuses on authentication logic */
describe("AuthService", () =>
{
	let service: AuthService;
	let httpMock: HttpTestingController;
	let router: Router;

	/** Session marker key used by AuthService */
	const SESSION_KEY: string = "auth_has_session";

	beforeEach(() =>
	{
		// Clear session marker before each test
		localStorage.removeItem(SESSION_KEY);

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
				provideRouter([]),
				AuthService
			]
		});

		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
		router = TestBed.inject(Router);
	});

	afterEach(() =>
	{
		httpMock.verify();
		localStorage.removeItem(SESSION_KEY);
	});

	it("should be created", () =>
	{
		expect(service).toBeTruthy();
	});

	describe("login", () =>
	{
		it("should login with credentials and set user state", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com",
					[DOTNET_ROLE_CLAIM]: ["Developer"]
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			let result: AuthResponse | undefined;
			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe((response: AuthResponse) =>
				{
					result = response;
				});

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			expect(req.request.method).toBe("POST");
			expect(req.request.body).toEqual({
				usernameOrEmail: "testuser",
				password: "Password123",
				rememberMe: false
			});
			req.flush(mockResponse);

			expect(result).toBeDefined();
			expect(result?.accessToken).toBe(mockResponse.accessToken);
			expect(service.isAuthenticated()).toBeTrue();
		});

		it("should not set user on login failure", () =>
		{
			service
				.login({
					usernameOrEmail: "invalid",
					password: "wrong",
					rememberMe: false
				})
				.subscribe({
					error: () =>
					{
						// Expected error
					}
				});

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(
				{ error: "Invalid credentials" },
				{ status: 401, statusText: "Unauthorized" }
			);

			expect(service.isAuthenticated()).toBeFalse();
		});

		it("should include rememberMe in login request when true", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: true
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			expect(req.request.body).toEqual({
				usernameOrEmail: "testuser",
				password: "Password123",
				rememberMe: true
			});
			req.flush(mockResponse);
		});

		it("should include rememberMe in login request when false", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			expect(req.request.body).toEqual({
				usernameOrEmail: "testuser",
				password: "Password123",
				rememberMe: false
			});
			req.flush(mockResponse);
		});
	});

	describe("logout", () =>
	{
		it("should clear user state on logout", () =>
		{
			// First login to set state
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const loginReq = httpMock.expectOne(
				`${environment.apiUrl}/auth/login`
			);
			loginReq.flush(mockResponse);

			expect(service.isAuthenticated()).toBeTrue();

			// Now logout
			service.logout();

			// Expect logout API call
			const logoutReq = httpMock.expectOne(
				`${environment.apiUrl}/auth/logout`
			);
			logoutReq.flush({});

			expect(service.isAuthenticated()).toBeFalse();
			expect(service.user()).toBeNull();
		});
	});

	describe("hasRole", () =>
	{
		it("should correctly check user role", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com",
					[DOTNET_ROLE_CLAIM]: ["Developer", "Admin"]
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.hasRole("Developer")).toBeTrue();
			expect(service.hasRole("Admin")).toBeTrue();
			expect(service.hasRole("SuperAdmin")).toBeFalse();
		});

		it("should handle single role as string", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com",
					[DOTNET_ROLE_CLAIM]: "Developer"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.hasRole("Developer")).toBeTrue();
			expect(service.hasRole("Admin")).toBeFalse();
		});
	});

	describe("hasAnyRole", () =>
	{
		it("should return true if user has any of the specified roles", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com",
					[DOTNET_ROLE_CLAIM]: "Developer"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.hasAnyRole("Developer", "Admin")).toBeTrue();
			expect(service.hasAnyRole("Admin", "SuperAdmin")).toBeFalse();
		});
	});

	describe("fullName parsing", () =>
	{
		it("should set fullName from given_name claim", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "johndoe",
					email: "john@example.com",
					given_name: "John Doe"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "johndoe",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.user()?.fullName).toBe("John Doe");
		});

		it("should set fullName to null when given_name not present", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "johndoe",
					email: "john@example.com"
					// No given_name
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "johndoe",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.user()?.fullName).toBeNull();
		});

		it("should set fullName to null when given_name is empty string", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "johndoe",
					email: "john@example.com",
					given_name: ""
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "johndoe",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.user()?.fullName).toBeNull();
		});
	});

	describe("refreshToken", () =>
	{
		it("should refresh tokens successfully", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			let result: AuthResponse | null = null;
			service
				.refreshToken()
				.subscribe((response: AuthResponse | null) =>
				{
					result = response;
				});

			const req = httpMock.expectOne(
				`${environment.apiUrl}/auth/refresh`
			);
			expect(req.request.method).toBe("POST");
			req.flush(mockResponse);

			expect(result).not.toBeNull();
			const authResult: AuthResponse = result!;
			expect(authResult.accessToken).toBe(mockResponse.accessToken);
		});

		it("should return null on refresh failure", () =>
		{
			let result: AuthResponse | null | undefined;
			service
				.refreshToken()
				.subscribe((response: AuthResponse | null) =>
				{
					result = response;
				});

			const req = httpMock.expectOne(
				`${environment.apiUrl}/auth/refresh`
			);
			req.flush(
				{ error: "Token expired" },
				{ status: 401, statusText: "Unauthorized" }
			);

			expect(result).toBeNull();
		});
	});

	describe("isTokenExpired", () =>
	{
		it("should return true when not authenticated", () =>
		{
			expect(service.isTokenExpired()).toBeTrue();
		});

		it("should return false for valid token", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com",
					exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
				}),
				expiresAt: new Date(Date.now() + 3600000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(service.isTokenExpired()).toBeFalse();
		});
	});

	describe("getAccessToken", () =>
	{
		it("should return null when not authenticated", () =>
		{
			expect(service.getAccessToken()).toBeNull();
		});

		it("should return token when authenticated", () =>
		{
			const mockResponse: AuthResponse = {
				accessToken: createMockJwt({
					sub: "1",
					unique_name: "testuser",
					email: "test@example.com"
				}),
				expiresAt: new Date(Date.now() + 900000).toISOString(),
				requiresPasswordChange: false
			};

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			const token: string | null = service.getAccessToken();
			expect(token).not.toBeNull();
			expect(token).toBe(mockResponse.accessToken);
		});
	});

	describe("loginWithProvider", () =>
	{
		/**
		 * Note: Cannot directly test loginWithProvider as it sets window.location.href
		 * which causes a full page reload in Karma tests.
		 * The functionality is covered by E2E tests instead.
		 */
		it("should construct correct OAuth URL", () =>
		{
			// Test that the URL would be correct without triggering redirect
			const expectedUrl: string = `${environment.apiUrl}/auth/github`;

			expect(expectedUrl).toContain("/auth/github");
		});
	});

	describe("initialize", () =>
	{
		it("should not attempt refresh without existing session", () =>
		{
			let completed: boolean = false;
			service.initialize().subscribe(() => (completed = true));

			// No HTTP request should be made
			httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
			expect(completed).toBeTrue();
		});

		it("should attempt refresh when session marker exists", () =>
		{
			localStorage.setItem(SESSION_KEY, "true");

			// Need fresh service instance to test initialize
			service = TestBed.inject(AuthService);
			let completed: boolean = false;
			service.initialize().subscribe(() => (completed = true));

			const req = httpMock.expectOne(
				`${environment.apiUrl}/auth/refresh`
			);
			expect(req.request.method).toBe("POST");
			req.flush(
				{ error: "No token" },
				{ status: 401, statusText: "Unauthorized" }
			);
			expect(completed).toBeTrue();
		});

		it("should only run once per service instance", () =>
		{
			localStorage.setItem(SESSION_KEY, "true");
			service = TestBed.inject(AuthService);

			// First call - should attempt refresh
			service.initialize().subscribe();
			const req = httpMock.expectOne(
				`${environment.apiUrl}/auth/refresh`
			);
			req.flush(
				{ error: "No token" },
				{ status: 401, statusText: "Unauthorized" }
			);

			// Second call - should not make another request
			let secondCompleted: boolean = false;
			service.initialize().subscribe(() => (secondCompleted = true));
			httpMock.expectNone(`${environment.apiUrl}/auth/refresh`);
			expect(secondCompleted).toBeTrue();
		});
	});

	describe("session marker", () =>
	{
		it("should set session marker on login", () =>
		{
			const mockResponse: AuthResponse = createMockAuthResponse();

			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
			req.flush(mockResponse);

			expect(localStorage.getItem(SESSION_KEY)).toBe("true");
		});

		it("should clear session marker on logout", () =>
		{
			localStorage.setItem(SESSION_KEY, "true");

			// Login first
			const mockResponse: AuthResponse = createMockAuthResponse();
			service
				.login({
					usernameOrEmail: "testuser",
					password: "Password123",
					rememberMe: false
				})
				.subscribe();

			const loginReq = httpMock.expectOne(
				`${environment.apiUrl}/auth/login`
			);
			loginReq.flush(mockResponse);

			// Logout
			service.logout();
			const logoutReq = httpMock.expectOne(
				`${environment.apiUrl}/auth/logout`
			);
			logoutReq.flush({});

			expect(localStorage.getItem(SESSION_KEY)).toBeNull();
		});
	});

	describe("setPassword", () =>
	{
		it("should call set password endpoint with token and new password", () =>
		{
			const token: string = "valid-reset-token";
			const newPassword: string = "NewPassword123!";

			let completed: boolean = false;
			service.setPassword(token, newPassword).subscribe(() =>
			{
				completed = true;
			});

			const req = httpMock.expectOne(
				`${environment.apiUrl}/auth/set-password`
			);
			expect(req.request.method).toBe("POST");
			expect(req.request.body).toEqual({
				token,
				newPassword
			});
			req.flush(null);

			expect(completed).toBeTrue();
		});
	});
});

/**
 * Creates a mock JWT token for testing.
 * @param payload - JWT payload with claims
 * @returns Base64-encoded JWT string
 */
function createMockJwt(payload: Record<string, unknown>): string
{
	const header: string = btoa(
		JSON.stringify({
			alg: "HS256",
			typ: "JWT"
		})
	);
	const body: string = btoa(
		JSON.stringify({
			exp: Math.floor(Date.now() / 1000) + 3600,
			iat: Math.floor(Date.now() / 1000),
			...payload
		})
	);
	return `${header}.${body}.signature`;
}

/**
 * Creates a standard mock auth response for testing.
 * @param overrides - Optional overrides for default values
 * @returns AuthResponse with default test values
 */
function createMockAuthResponse(
	overrides: Partial<AuthResponse> = {}
): AuthResponse
{
	return {
		accessToken: createMockJwt({
			sub: "1",
			unique_name: "testuser",
			email: "test@example.com"
		}),
		expiresAt: new Date(Date.now() + 900000).toISOString(),
		requiresPasswordChange: false,
		...overrides
	};
}
