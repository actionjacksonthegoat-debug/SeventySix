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
import { BROADCAST_MESSAGE_TYPE } from "@shared/constants";
import { AuthResponse } from "@shared/models";
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { Mock, vi } from "vitest";
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";
import { WindowService } from "./window.service";

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

function loginAndFlush(
	svc: AuthService,
	mock: HttpTestingController,
	response?: AuthResponse): AuthResponse
{
	const mockResponse: AuthResponse =
		response ?? createMockAuthResponse();
	svc
		.login(
			{
				usernameOrEmail: "testuser",
				password: "Password123",
				rememberMe: false
			})
		.subscribe();
	const req: TestRequest =
		mock.expectOne(`${environment.apiUrl}/auth/login`);
	req.flush(mockResponse);
	return mockResponse;
}

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

describe("AuthService - refreshToken edge cases",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;

		beforeEach(
			() =>
			{
				localStorage.clear();
				sessionStorage.clear();

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
				localStorage.clear();
				sessionStorage.clear();
			});

		it("should clear auth state on 401 refresh failure",
			() =>
			{
				loginAndFlush(service, httpMock);
				expect(service.isAuthenticated())
					.toBe(true);

				let result: unknown;
				service
					.refreshToken()
					.subscribe(
						(response) =>
						{
							result = response;
						});

				const req: TestRequest =
					httpMock.expectOne(
						`${environment.apiUrl}/auth/refresh`);
				req.flush(
					{ error: "Token revoked" },
					{ status: 401, statusText: "Unauthorized" });

				expect(result)
					.toBeNull();
				expect(service.isAuthenticated())
					.toBe(false);
			});

		it("should not clear auth state on 429 refresh failure",
			() =>
			{
				loginAndFlush(service, httpMock);
				expect(service.isAuthenticated())
					.toBe(true);

				let result: unknown;
				service
					.refreshToken()
					.subscribe(
						(response) =>
						{
							result = response;
						});

				const req: TestRequest =
					httpMock.expectOne(
						`${environment.apiUrl}/auth/refresh`);
				req.flush(
					{ error: "Rate limited" },
					{ status: 429, statusText: "Too Many Requests" });

				expect(result)
					.toBeNull();
				expect(service.isAuthenticated())
					.toBe(true);
			});

		it("should deduplicate concurrent refresh calls via single-flight pattern",
			() =>
			{
				const mockResponse: AuthResponse =
					createMockAuthResponse();

				let resultOne: unknown;
				let resultTwo: unknown;
				service
					.refreshToken()
					.subscribe(
						(response) =>
						{
							resultOne = response;
						});
				service
					.refreshToken()
					.subscribe(
						(response) =>
						{
							resultTwo = response;
						});

				const requests: TestRequest[] =
					httpMock.match(
						`${environment.apiUrl}/auth/refresh`);
				expect(requests.length)
					.toBe(1);
				requests[0].flush(mockResponse);

				expect(resultOne).not.toBeNull();
				expect(resultTwo).not.toBeNull();
			});
	});

describe("AuthService - cross-tab refresh via BroadcastChannel",
	() =>
	{
		let mockChannel: {
			postMessage: ReturnType<typeof vi.fn>;
			close: ReturnType<typeof vi.fn>;
			onmessage: ((event: MessageEvent) => void) | null;
		};

		beforeEach(
			() =>
			{
				localStorage.clear();
				sessionStorage.clear();

				mockChannel =
					{
						postMessage: vi.fn(),
						close: vi.fn(),
						onmessage: null
					};

				vi
					.stubGlobal(
						"BroadcastChannel",
						class MockBroadcastChannel
						{
							postMessage: ReturnType<typeof vi.fn> =
								mockChannel.postMessage;
							close: ReturnType<typeof vi.fn> =
								mockChannel.close;
							set onmessage(handler: ((event: MessageEvent) => void) | null)
							{
								mockChannel.onmessage = handler;
							}
							get onmessage(): ((event: MessageEvent) => void) | null
							{
								return mockChannel.onmessage;
							}
						});
			});

		afterEach(
			() =>
			{
				vi.unstubAllGlobals();
				localStorage.clear();
				sessionStorage.clear();
			});

		it("should broadcast token_refreshed on successful refresh",
			() =>
			{
				const { authService, httpMock: freshHttpMock } =
					createFreshTestBed();

				authService
					.refreshToken()
					.subscribe();

				const req: TestRequest =
					freshHttpMock.expectOne(
						`${environment.apiUrl}/auth/refresh`);
				req.flush(createMockAuthResponse());

				expect(mockChannel.postMessage)
					.toHaveBeenCalledWith(
						{ type: BROADCAST_MESSAGE_TYPE.TOKEN_REFRESHED });

				freshHttpMock
					.match(`${environment.apiUrl}/auth/me`)
					.forEach(
						(request: TestRequest) =>
							request.flush(null));
				freshHttpMock.verify();
			});

		it("should broadcast logout on 401 refresh failure",
			() =>
			{
				const { authService, httpMock: freshHttpMock } =
					createFreshTestBed();

				authService
					.refreshToken()
					.subscribe();

				const req: TestRequest =
					freshHttpMock.expectOne(
						`${environment.apiUrl}/auth/refresh`);
				req.flush(
					{ error: "Revoked" },
					{ status: 401, statusText: "Unauthorized" });

				expect(mockChannel.postMessage)
					.toHaveBeenCalledWith(
						{ type: BROADCAST_MESSAGE_TYPE.LOGOUT });

				freshHttpMock.verify();
			});

		it("should force logout when receiving logout broadcast from another tab",
			() =>
			{
				const { authService, httpMock: freshHttpMock } =
					createFreshTestBed();

				authService
					.initialize()
					.subscribe();
				loginAndFlush(authService, freshHttpMock);

				expect(authService.isAuthenticated())
					.toBe(true);

				mockChannel.onmessage?.(
					{ data: { type: BROADCAST_MESSAGE_TYPE.LOGOUT } } as MessageEvent);

				expect(authService.isAuthenticated())
					.toBe(false);

				freshHttpMock
					.match(`${environment.apiUrl}/auth/me`)
					.forEach(
						(request: TestRequest) =>
							request.flush(null));
				freshHttpMock.verify();
			});
	});