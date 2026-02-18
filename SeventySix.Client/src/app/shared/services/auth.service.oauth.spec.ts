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
import { createTestQueryClient } from "@shared/testing";
import {
	provideTanStackQuery,
	QueryClient
} from "@tanstack/angular-query-experimental";
import { Mock, vi } from "vitest";
import { AuthService } from "./auth.service";
import { createMockAuthResponse } from "./auth.service.test-helpers";
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

/** AuthService OAuth Tests - popup flow, message listener, code exchange */
describe("AuthService OAuth",
	() =>
	{
		let service: AuthService;
		let httpMock: HttpTestingController;
		let mockWindowService: MockWindowService;

		beforeEach(
			() =>
			{
				localStorage.removeItem(SESSION_KEY);

				const queryClient: QueryClient =
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

		describe("loginWithProvider",
			() =>
			{
				it("should open OAuth popup with correct URL",
					() =>
					{
						const mockPopup: Partial<Window> =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.loginWithProvider("github");

						expect(mockWindowService.openWindow)
							.toHaveBeenCalledWith(
								`${environment.apiUrl}/auth/oauth/github`,
								"oauth_popup");
					});

				it("should fall back to navigation when popup blocked",
					() =>
					{
						mockWindowService.openWindow.mockReturnValue(null);

						service.loginWithProvider("github");

						expect(mockWindowService.navigateTo)
							.toHaveBeenCalledWith(
								`${environment.apiUrl}/auth/oauth/github`);
						expect(service.isOAuthInProgress())
							.toBe(false);
					});
			});

		describe("initializeOAuthMessageListener",
			() =>
			{
				it("should ignore cross-origin messages",
					() =>
					{
						service
							.initialize()
							.subscribe();

						const messageEvent: MessageEvent =
							new MessageEvent(
								"message",
								{
									origin: "https://evil.com",
									data: {
										type: "oauth_success",
										code: "test-code"
									}
								});
						window.dispatchEvent(messageEvent);

						httpMock.expectNone(
							`${environment.apiUrl}/auth/oauth/exchange`);
					});

				it("should process valid oauth_success message",
					() =>
					{
						service
							.initialize()
							.subscribe();

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						const messageEvent: MessageEvent =
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: {
										type: "oauth_success",
										code: "test-code"
									}
								});
						window.dispatchEvent(messageEvent);

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/oauth/exchange`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body)
							.toEqual(
								{ code: "test-code" });
						req.flush(createMockAuthResponse());
					});

				it("should process oauth_link_success message",
					() =>
					{
						service
							.initialize()
							.subscribe();

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						const messageEvent: MessageEvent =
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: { type: "oauth_link_success" }
								});
						window.dispatchEvent(messageEvent);

						// Should not call exchange endpoint (link flow, not login flow)
						httpMock.expectNone(
							`${environment.apiUrl}/auth/oauth/exchange`);
					});
			});

		describe("exchangeOAuthCode",
			() =>
			{
				it("should call exchange endpoint with code",
					() =>
					{
						service
							.initialize()
							.subscribe();

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: {
										type: "oauth_success",
										code: "exchange-code"
									}
								}));

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/oauth/exchange`);
						expect(req.request.body)
							.toEqual(
								{ code: "exchange-code" });
						expect(req.request.withCredentials)
							.toBe(true);
						req.flush(createMockAuthResponse());
					});

				it("should navigate to login on exchange error",
					() =>
					{
						service
							.initialize()
							.subscribe();

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: {
										type: "oauth_success",
										code: "bad-code"
									}
								}));

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/oauth/exchange`);
						req.flush(
							{ error: "Invalid code" },
							{ status: 400, statusText: "Bad Request" });
					});
			});

		describe("popup poll timer",
			() =>
			{
				beforeEach(
					() =>
					{
						vi.useFakeTimers();
					});

				afterEach(
					() =>
					{
						vi.useRealTimers();
					});

				it("should detect closed popup and call clearInterval",
					() =>
					{
						const clearIntervalSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(globalThis, "clearInterval");
						const mockPopup: { closed: boolean; } =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.loginWithProvider("github");

						mockPopup.closed = true;
						vi.advanceTimersByTime(600);

						expect(clearIntervalSpy)
							.toHaveBeenCalled();
						expect(service.isOAuthInProgress())
							.toBe(false);

						clearIntervalSpy.mockRestore();
					});

				it("should be cleaned up on successful oauth message",
					() =>
					{
						const clearIntervalSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(globalThis, "clearInterval");

						const mockPopup: { closed: boolean; } =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service
							.initialize()
							.subscribe();
						service.loginWithProvider("github");

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: {
										type: "oauth_success",
										code: "test-code"
									}
								}));

						expect(clearIntervalSpy)
							.toHaveBeenCalled();

						const req: TestRequest =
							httpMock.expectOne(
								`${environment.apiUrl}/auth/oauth/exchange`);
						req.flush(createMockAuthResponse());

						clearIntervalSpy.mockRestore();
					});
			});
	});
