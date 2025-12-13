import { HttpEvent, HttpHandler, HttpRequest } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthService } from "@infrastructure/services/auth.service";
import { of } from "rxjs";
import { authInterceptor } from "./auth.interceptor";

describe("authInterceptor", () =>
{
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockHandler: jasmine.SpyObj<HttpHandler>;

	beforeEach(() =>
	{
		mockAuthService =
			jasmine.createSpyObj("AuthService", [
			"getAccessToken",
			"isTokenExpired",
			"refreshToken"
		]);
		mockHandler =
			jasmine.createSpyObj("HttpHandler", ["handle"]);
		mockHandler.handle.and.returnValue(of({} as HttpEvent<unknown>));

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideHttpClient(),
				provideHttpClientTesting(),
				{ provide: AuthService, useValue: mockAuthService }
			]
		});
	});

	it("should add authorization header when token exists", () =>
	{
		mockAuthService.getAccessToken.and.returnValue("test-token");
		mockAuthService.isTokenExpired.and.returnValue(false);
		const req: HttpRequest<unknown> =
			new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs: HttpRequest<unknown> =
			mockHandler
			.handle
			.calls
			.mostRecent()
			.args[0] as HttpRequest<unknown>;
		expect(callArgs.headers.get("Authorization"))
			.toBe("Bearer test-token");
	});

	it("should not add header for public endpoints", () =>
	{
		mockAuthService.getAccessToken.and.returnValue("test-token");
		const req: HttpRequest<unknown> =
			new HttpRequest("GET", "/auth/login");

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs: HttpRequest<unknown> =
			mockHandler
			.handle
			.calls
			.mostRecent()
			.args[0] as HttpRequest<unknown>;
		expect(callArgs.headers.get("Authorization"))
			.toBeNull();
	});

	it("should add header for change-password endpoint", () =>
	{
		mockAuthService.getAccessToken.and.returnValue("test-token");
		mockAuthService.isTokenExpired.and.returnValue(false);
		const req: HttpRequest<unknown> =
			new HttpRequest(
			"POST",
			"/api/v1/auth/change-password",
			{ currentPassword: "old", newPassword: "new" });

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs: HttpRequest<unknown> =
			mockHandler
			.handle
			.calls
			.mostRecent()
			.args[0] as HttpRequest<unknown>;
		expect(callArgs.headers.get("Authorization"))
			.toBe("Bearer test-token");
	});

	it("should not add header when no token", () =>
	{
		mockAuthService.getAccessToken.and.returnValue(null);
		const req: HttpRequest<unknown> =
			new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs: HttpRequest<unknown> =
			mockHandler
			.handle
			.calls
			.mostRecent()
			.args[0] as HttpRequest<unknown>;
		expect(callArgs.headers.get("Authorization"))
			.toBeNull();
	});
});
