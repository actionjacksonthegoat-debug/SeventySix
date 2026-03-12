import { PLATFORM_ID, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { environment } from "@environments/environment";
import { OAUTH_FLOW_EVENT_TYPE, OAUTH_POPUP_NAME, OAUTH_POSTMESSAGE_TYPE } from "@shared/constants";
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
								OAUTH_POPUP_NAME.LOGIN);
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

				it("should emit error event when popup is blocked",
					() =>
					{
						mockWindowService.openWindow.mockReturnValue(null);

						const events: unknown[] = [];
						service.events$.subscribe(
							(event: unknown) => events.push(event));

						service.openLoginPopup("github");

						expect(service.isOAuthInProgress())
							.toBe(false);
						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{
									type: OAUTH_FLOW_EVENT_TYPE.ERROR,
									error: OAUTH_FLOW_EVENT_TYPE.POPUP_BLOCKED
								});
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
								OAUTH_POPUP_NAME.LINK);
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
										type: OAUTH_POSTMESSAGE_TYPE.SUCCESS,
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
										type: OAUTH_POSTMESSAGE_TYPE.SUCCESS,
										code: "test-code-123"
									}
								}));

						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{
									type: OAUTH_FLOW_EVENT_TYPE.CODE_RECEIVED,
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
									data: { type: OAUTH_POSTMESSAGE_TYPE.LINK_SUCCESS }
								}));

						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{ type: OAUTH_FLOW_EVENT_TYPE.LINK_SUCCESS });
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
										type: OAUTH_POSTMESSAGE_TYPE.SUCCESS,
										code: null
									}
								}));

						expect(events)
							.toHaveLength(0);
					});

				it("should emit error event for oauth_error message",
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
										type: OAUTH_POSTMESSAGE_TYPE.ERROR,
										error: "provider_denied"
									}
								}));

						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{
									type: "error",
									error: "provider_denied"
								});
					});

				it("should use default error message when oauth_error has no error field",
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
									data: { type: OAUTH_POSTMESSAGE_TYPE.ERROR }
								}));

						expect(events)
							.toHaveLength(1);
						expect(events[0])
							.toEqual(
								{
									type: "error",
									error: "OAuth login failed"
								});
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
											type: OAUTH_POSTMESSAGE_TYPE.SUCCESS,
											code: "relative-url-test"
										}
									}));

							expect(events)
								.toHaveLength(1);
							expect(events[0])
								.toEqual(
									{
										type: OAUTH_FLOW_EVENT_TYPE.CODE_RECEIVED,
										code: "relative-url-test"
									});
						}
						finally
						{
							environment.apiUrl = originalApiUrl;
						}
					});

				it("should accept messages from oauthAllowedOrigin when apiUrl is relative",
					() =>
					{
						const originalApiUrl: string =
							environment.apiUrl;
						const originalOauthOrigin: string =
							environment.oauthAllowedOrigin;

						try
						{
							environment.apiUrl = "/api/v1";
							environment.oauthAllowedOrigin = "https://localhost:7074";

							const events: unknown[] = [];
							service.events$.subscribe(
								(event: unknown) => events.push(event));

							window.dispatchEvent(
								new MessageEvent(
									"message",
									{
										origin: "https://localhost:7074",
										data: {
											type: OAUTH_POSTMESSAGE_TYPE.SUCCESS,
											code: "cross-origin-api-test"
										}
									}));

							expect(events)
								.toHaveLength(1);
							expect(events[0])
								.toEqual(
									{
										type: OAUTH_FLOW_EVENT_TYPE.CODE_RECEIVED,
										code: "cross-origin-api-test"
									});
						}
						finally
						{
							environment.apiUrl = originalApiUrl;
							environment.oauthAllowedOrigin = originalOauthOrigin;
						}
					});

				it("should reject messages from unknown origin even when oauthAllowedOrigin is set",
					() =>
					{
						const originalApiUrl: string =
							environment.apiUrl;
						const originalOauthOrigin: string =
							environment.oauthAllowedOrigin;

						try
						{
							environment.apiUrl = "/api/v1";
							environment.oauthAllowedOrigin = "https://localhost:7074";

							const events: unknown[] = [];
							service.events$.subscribe(
								(event: unknown) => events.push(event));

							window.dispatchEvent(
								new MessageEvent(
									"message",
									{
										origin: "https://evil.com",
										data: {
											type: OAUTH_POSTMESSAGE_TYPE.SUCCESS,
											code: "stolen-code"
										}
									}));

							expect(events)
								.toHaveLength(0);
						}
						finally
						{
							environment.apiUrl = originalApiUrl;
							environment.oauthAllowedOrigin = originalOauthOrigin;
						}
					});
			});
	});