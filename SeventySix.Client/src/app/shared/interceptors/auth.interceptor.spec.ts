import { HttpEvent, HttpRequest } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthService } from "@shared/services/auth.service";
import { of } from "rxjs";
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

		it("should add header for change-password endpoint",
			() =>
			{
				mockAuthService.getAccessToken.mockReturnValue("test-token");
				mockAuthService.isTokenExpired.mockReturnValue(false);
				const req: HttpRequest<unknown> =
					new HttpRequest(
						"POST",
						"/api/v1/auth/change-password",
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
	});
