import {
	HttpErrorResponse,
	HttpEvent,
	HttpRequest
} from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthResponse } from "@shared/models";
import { AuthService } from "@shared/services/auth.service";
import { of, throwError } from "rxjs";
import { type Mock, vi } from "vitest";
import { authInterceptor } from "./auth.interceptor";

interface MockAuthService
{
	getAccessToken: Mock;
	isTokenExpired: Mock;
	refreshToken: Mock;
}

interface MockHttpHandler
{
	handle: Mock;
}

describe("authInterceptor",
	() =>
	{
		let mockAuthService: MockAuthService;
		let mockHandler: MockHttpHandler;

		beforeEach(
			() =>
			{
				mockAuthService =
					{
						getAccessToken: vi.fn(),
						isTokenExpired: vi.fn(),
						refreshToken: vi.fn()
					};
				mockHandler =
					{
						handle: vi.fn()
					};
				mockHandler.handle.mockReturnValue(of({} as HttpEvent<unknown>));

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							provideHttpClient(),
							provideHttpClientTesting(),
							{ provide: AuthService, useValue: mockAuthService }
						]
					});
			});

		it("should add authorization header when token exists",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue("test-token");
				mockAuthService.isTokenExpired.mockReturnValue(false);
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				TestBed.runInInjectionContext(
					() =>
					{
						authInterceptor(req, mockHandler.handle.bind(mockHandler));
					});

				const callArgs: HttpRequest<unknown> =
					mockHandler
						.handle
						.mock
						.calls
						.at(-1)![0] as HttpRequest<unknown>;
				expect(callArgs.headers.get("Authorization"))
					.toBe("Bearer test-token");
			});

		it("should not add header for public endpoints",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue("test-token");
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/auth/login");

				TestBed.runInInjectionContext(
					() =>
					{
						authInterceptor(req, mockHandler.handle.bind(mockHandler));
					});

				const callArgs: HttpRequest<unknown> =
					mockHandler
						.handle
						.mock
						.calls
						.at(-1)![0] as HttpRequest<unknown>;
				expect(callArgs.headers.get("Authorization"))
					.toBeNull();
			});

		it("should not add header for external URLs",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue("test-token");
				mockAuthService.isTokenExpired.mockReturnValue(false);
				const req: HttpRequest<unknown> =
					new HttpRequest(
						"GET",
						"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/angular.svg");

				TestBed.runInInjectionContext(
					() =>
					{
						authInterceptor(req, mockHandler.handle.bind(mockHandler));
					});

				const callArgs: HttpRequest<unknown> =
					mockHandler
						.handle
						.mock
						.calls
						.at(-1)![0] as HttpRequest<unknown>;
				expect(callArgs.headers.get("Authorization"))
					.toBeNull();
			});

		it("should add header for change-password endpoint",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue("test-token");
				mockAuthService.isTokenExpired.mockReturnValue(false);
				const req: HttpRequest<unknown> =
					new HttpRequest(
						"POST",
						"/api/v1/auth/password/change",
						{ currentPassword: "old", newPassword: "new" });

				TestBed.runInInjectionContext(
					() =>
					{
						authInterceptor(req, mockHandler.handle.bind(mockHandler));
					});

				const callArgs: HttpRequest<unknown> =
					mockHandler
						.handle
						.mock
						.calls
						.at(-1)![0] as HttpRequest<unknown>;
				expect(callArgs.headers.get("Authorization"))
					.toBe("Bearer test-token");
			});

		it("should add header for cross-origin API URL",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue("test-token");
				mockAuthService.isTokenExpired.mockReturnValue(false);
				const req: HttpRequest<unknown> =
					new HttpRequest(
						"GET",
						"http://localhost:1234/api/v1/auth/me");

				TestBed.runInInjectionContext(
					() =>
					{
						authInterceptor(req, mockHandler.handle.bind(mockHandler));
					});

				const callArgs: HttpRequest<unknown> =
					mockHandler
						.handle
						.mock
						.calls
						.at(-1)![0] as HttpRequest<unknown>;
				expect(callArgs.headers.get("Authorization"))
					.toBe("Bearer test-token");
			});

		it("should not add header when no token",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue(null);
				const req: HttpRequest<unknown> =
					new HttpRequest("GET", "/api/data");

				TestBed.runInInjectionContext(
					() =>
					{
						authInterceptor(req, mockHandler.handle.bind(mockHandler));
					});

				const callArgs: HttpRequest<unknown> =
					mockHandler
						.handle
						.mock
						.calls
						.at(-1)![0] as HttpRequest<unknown>;
				expect(callArgs.headers.get("Authorization"))
					.toBeNull();
			});

		describe("Token Refresh",
			() =>
			{
				it("should refresh token when expired before making request",
					() =>
					{
						const mockRefreshResponse: Partial<AuthResponse> =
							{ accessToken: "new-token" };

						mockAuthService.getAccessToken.mockReturnValue("expired-token");
						mockAuthService.isTokenExpired.mockReturnValue(true);
						mockAuthService.refreshToken.mockReturnValue(of(mockRefreshResponse));

						// After refresh, return the new token
						mockAuthService.getAccessToken.mockReturnValueOnce("expired-token");
						mockAuthService.getAccessToken.mockReturnValueOnce("new-token");

						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						TestBed.runInInjectionContext(
							() =>
							{
								authInterceptor(req, mockHandler.handle.bind(mockHandler))
									.subscribe();
							});

						expect(mockAuthService.refreshToken)
							.toHaveBeenCalled();
					});

				it("should use new token after successful refresh",
					() =>
					{
						const mockRefreshResponse: Partial<AuthResponse> =
							{ accessToken: "refreshed-token" };

						mockAuthService
							.getAccessToken
							.mockReturnValueOnce("expired-token")
							.mockReturnValueOnce("refreshed-token");
						mockAuthService.isTokenExpired.mockReturnValue(true);
						mockAuthService.refreshToken.mockReturnValue(of(mockRefreshResponse));

						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						TestBed.runInInjectionContext(
							() =>
							{
								authInterceptor(req, mockHandler.handle.bind(mockHandler))
									.subscribe();
							});

						const callArgs: HttpRequest<unknown> =
							mockHandler
								.handle
								.mock
								.calls
								.at(-1)![0] as HttpRequest<unknown>;
						expect(callArgs.headers.get("Authorization"))
							.toBe("Bearer refreshed-token");
					});

				it("should proceed without token when refresh returns null",
					() =>
					{
						mockAuthService.getAccessToken.mockReturnValue("expired-token");
						mockAuthService.isTokenExpired.mockReturnValue(true);
						mockAuthService.refreshToken.mockReturnValue(of(null));

						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						TestBed.runInInjectionContext(
							() =>
							{
								authInterceptor(req, mockHandler.handle.bind(mockHandler))
									.subscribe();
							});

						const callArgs: HttpRequest<unknown> =
							mockHandler
								.handle
								.mock
								.calls
								.at(-1)![0] as HttpRequest<unknown>;
						expect(callArgs.headers.get("Authorization"))
							.toBeNull();
					});

				it("should propagate error when refresh fails",
					() =>
					{
						const refreshError: HttpErrorResponse =
							new HttpErrorResponse(
								{ status: 401, statusText: "Unauthorized" });

						mockAuthService.getAccessToken.mockReturnValue("expired-token");
						mockAuthService.isTokenExpired.mockReturnValue(true);
						mockAuthService.refreshToken.mockReturnValue(throwError(
							() => refreshError));

						const req: HttpRequest<unknown> =
							new HttpRequest("GET", "/api/data");

						let caughtError: HttpErrorResponse | undefined;
						TestBed.runInInjectionContext(
							() =>
							{
								authInterceptor(req, mockHandler.handle.bind(mockHandler))
									.subscribe(
										{
											error: (error: HttpErrorResponse) =>
											{
												caughtError = error;
											}
										});
							});

						expect(caughtError)
							.toBeDefined();
						expect(caughtError?.status)
							.toBe(401);
					});
			});
	});
