import { PLATFORM_ID, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { OAuthFlowService } from "./oauth-flow.service";
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

describe("OAuthFlowService",
	() =>
	{
		let service: OAuthFlowService;
		let mockWindowService: MockWindowService;

		beforeEach(
			() =>
			{
				mockWindowService =
					createMockWindowService();

				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							{ provide: PLATFORM_ID, useValue: "browser" },
							{
								provide: WindowService,
								useValue: mockWindowService
							},
							OAuthFlowService
						]
					});

				service =
					TestBed.inject(OAuthFlowService);
			});

		afterEach(
			() =>
			{
				vi.useRealTimers();
			});

		describe("openLoginPopup",
			() =>
			{
				it("should open popup with correct URL for provider",
					() =>
					{
						const mockPopup: Partial<Window> =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.openLoginPopup("github");

						expect(mockWindowService.openWindow)
							.toHaveBeenCalledWith(
								`${environment.apiUrl}/auth/oauth/github`,
								"oauth_popup");
					});

				it("should set isOAuthInProgress to true when popup opens",
					() =>
					{
						const mockPopup: Partial<Window> =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.openLoginPopup("github");

						expect(service.isOAuthInProgress())
							.toBe(true);
					});

				it("should fall back to full-page navigation when popup is blocked",
					() =>
					{
						mockWindowService.openWindow.mockReturnValue(null);

						service.openLoginPopup("github");

						expect(mockWindowService.navigateTo)
							.toHaveBeenCalledWith(
								`${environment.apiUrl}/auth/oauth/github`);
						expect(service.isOAuthInProgress())
							.toBe(false);
					});

				it("should sanitize absolute return URL to /",
					() =>
					{
						const mockPopup: Partial<Window> =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.openLoginPopup("github", "https://evil.com/steal");

						// Validate stored return URL is sanitized to /
						const stored: string | null =
							sessionStorage.getItem("auth_return_url");
						expect(stored)
							.toBe("/");
					});

				it("should allow valid relative return URL",
					() =>
					{
						const mockPopup: Partial<Window> =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.openLoginPopup("github", "/dashboard");

						const stored: string | null =
							sessionStorage.getItem("auth_return_url");
						expect(stored)
							.toBe("/dashboard");
					});
			});

		describe("openLinkPopup",
			() =>
			{
				it("should open popup with provided authorization URL",
					() =>
					{
						const authorizationUrl: string = "https://github.com/login/oauth/authorize?client_id=xxx";
						const mockPopup: Partial<Window> =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.openLinkPopup(authorizationUrl);

						expect(mockWindowService.openWindow)
							.toHaveBeenCalledWith(
								authorizationUrl,
								"oauth_link_popup");
						expect(service.isOAuthInProgress())
							.toBe(true);
					});

				it("should reset isOAuthInProgress when popup is blocked",
					() =>
					{
						mockWindowService.openWindow.mockReturnValue(null);

						service.openLinkPopup("https://provider.com/oauth");

						expect(service.isOAuthInProgress())
							.toBe(false);
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

				it("should reset isOAuthInProgress when popup is closed",
					() =>
					{
						const mockPopup: { closed: boolean; } =
							{ closed: false };
						mockWindowService.openWindow.mockReturnValue(mockPopup);

						service.openLoginPopup("github");
						expect(service.isOAuthInProgress())
							.toBe(true);

						mockPopup.closed = true;
						vi.advanceTimersByTime(600);

						expect(service.isOAuthInProgress())
							.toBe(false);
					});
			});

		describe("message listener",
			() =>
			{
				it("should ignore messages from unknown origins",
					() =>
					{
						const events: unknown[] = [];
						service.events$.subscribe(
							(event: unknown) => events.push(event));

						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: "https://evil.com",
									data: {
										type: "oauth_success",
										code: "fake-code"
									}
								}));

						expect(events)
							.toHaveLength(0);
					});

				it("should emit code_received event for valid oauth_success message",
					() =>
					{
						const events: unknown[] = [];
						service.events$.subscribe(
							(event: unknown) => events.push(event));

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: {
										type: "oauth_success",
										code: "test-code-123"
									}
								}));

						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{
									type: "code_received",
									code: "test-code-123"
								});
					});

				it("should emit link_success event for oauth_link_success message",
					() =>
					{
						const events: unknown[] = [];
						service.events$.subscribe(
							(event: unknown) => events.push(event));

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: { type: "oauth_link_success" }
								}));

						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{ type: "link_success" });
					});

				it("should not emit event when code is missing from oauth_success",
					() =>
					{
						const events: unknown[] = [];
						service.events$.subscribe(
							(event: unknown) => events.push(event));

						const allowedOrigin: string =
							new URL(environment.apiUrl).origin;
						window.dispatchEvent(
							new MessageEvent(
								"message",
								{
									origin: allowedOrigin,
									data: {
										type: "oauth_success",
										code: null
									}
								}));

						expect(events)
							.toHaveLength(0);
					});

				it("should accept messages from window.location.origin when apiUrl is relative",
					() =>
					{
						// Simulate production where apiUrl is relative ('/api/v1') and verify
						// the guard falls back to window.location.origin instead of throwing
						// TypeError: Invalid URL inside new URL(relativeUrl).
						const originalApiUrl: string =
							environment.apiUrl;

						try
						{
							environment.apiUrl = "/api/v1";

							const events: unknown[] = [];
							service.events$.subscribe(
								(event: unknown) => events.push(event));

							window.dispatchEvent(
								new MessageEvent(
									"message",
									{
										origin: window.location.origin,
										data: {
											type: "oauth_success",
											code: "relative-url-test"
										}
									}));

							expect(events)
								.toHaveLength(1);
							expect(events[0])
								.toEqual(
									{
										type: "code_received",
										code: "relative-url-test"
									});
						}
						finally
						{
							environment.apiUrl = originalApiUrl;
						}
					});
			});
	});