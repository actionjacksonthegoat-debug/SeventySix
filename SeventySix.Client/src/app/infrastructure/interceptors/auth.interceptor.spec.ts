import { TestBed } from "@angular/core/testing";
import { HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { Observable, of } from "rxjs";
import { authInterceptor } from "./auth.interceptor";
import { TokenStorageService } from "@infrastructure/services/token-storage.service";

describe("authInterceptor", () =>
{
	let mockTokenStorage: jasmine.SpyObj<TokenStorageService>;
	let mockHandler: jasmine.SpyObj<HttpHandler>;

	beforeEach(() =>
	{
		mockTokenStorage = jasmine.createSpyObj("TokenStorageService", [
			"getAccessToken"
		]);
		mockHandler = jasmine.createSpyObj("HttpHandler", ["handle"]);
		mockHandler.handle.and.returnValue(of({} as HttpEvent<any>));

		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: TokenStorageService, useValue: mockTokenStorage }
			]
		});
	});

	it("should add authorization header when token exists", () =>
	{
		mockTokenStorage.getAccessToken.and.returnValue("test-token");
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs = mockHandler.handle.calls.mostRecent().args[0];
		expect(callArgs.headers.get("Authorization")).toBe("Bearer test-token");
	});

	it("should not add header for public endpoints", () =>
	{
		mockTokenStorage.getAccessToken.and.returnValue("test-token");
		const req = new HttpRequest("GET", "/public/data");

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs = mockHandler.handle.calls.mostRecent().args[0];
		expect(callArgs.headers.get("Authorization")).toBeNull();
	});

	it("should not add header when no token", () =>
	{
		mockTokenStorage.getAccessToken.and.returnValue(null);
		const req = new HttpRequest("GET", "/api/data");

		TestBed.runInInjectionContext(() =>
		{
			authInterceptor(req, mockHandler.handle.bind(mockHandler));
		});

		const callArgs = mockHandler.handle.calls.mostRecent().args[0];
		expect(callArgs.headers.get("Authorization")).toBeNull();
	});
});
