import { ComponentFixture } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { APP_ROUTES } from "@shared/constants/routes.constants";
import { AuthService } from "@shared/services/auth.service";
import { LayoutService } from "@shared/services/layout.service";
import { ThemeService } from "@shared/services/theme.service";
import { ComponentTestBed } from "@shared/testing";
import {
	createMockAuthService,
	createMockThemeService,
	createMockUserProfile
} from "@testing/mocks";
import { vi } from "vitest";
import { HeaderComponent } from "./header.component";

interface MockLayoutService
{
	toggleSidebar: ReturnType<typeof vi.fn>;
}

describe("HeaderComponent",
	() =>
	{
		let component: HeaderComponent;
		let fixture: ComponentFixture<HeaderComponent>;
		let mockThemeService: ReturnType<typeof createMockThemeService>;
		let mockLayoutService: MockLayoutService;
		let mockAuthService: ReturnType<typeof createMockAuthService>;
		let router: Router;

		beforeEach(
			async () =>
			{
				mockThemeService =
					createMockThemeService();
				mockLayoutService =
					{
						toggleSidebar: vi.fn()
					};
				mockAuthService =
					createMockAuthService();
				fixture =
					await new ComponentTestBed<HeaderComponent>()
						.withProvider(provideRouter([]))
						.withProvider(
							{ provide: ThemeService, useValue: mockThemeService })
						.withProvider(
							{
								provide: LayoutService,
								useValue: mockLayoutService
							})
						.withProvider(
							{ provide: AuthService, useValue: mockAuthService })
						.build(HeaderComponent);

				component =
					fixture.componentInstance;
				router =
					fixture.debugElement.injector.get(Router);
				vi.spyOn(router, "navigate");
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should toggle sidebar",
			() =>
			{
				component.toggleSidebar();
				expect(mockLayoutService.toggleSidebar)
					.toHaveBeenCalled();
			});

		it("should toggle brightness",
			() =>
			{
				vi.spyOn(mockThemeService, "toggleBrightness");
				component.toggleBrightness();
				expect(mockThemeService.toggleBrightness)
					.toHaveBeenCalled();
			});

		it("should toggle color scheme",
			() =>
			{
				vi.spyOn(mockThemeService, "toggleColorScheme");
				component.toggleColorScheme();
				expect(mockThemeService.toggleColorScheme)
					.toHaveBeenCalled();
			});

		describe("authentication",
			() =>
			{
				it("should show guest menu when not authenticated",
					() =>
					{
						mockAuthService.setUser(null);
						fixture.detectChanges();

						const compiled: HTMLElement =
							fixture.nativeElement;
						const guestMenuButton: HTMLButtonElement | null =
							compiled.querySelector(
								"[data-testid='guest-menu-button']");

						expect(guestMenuButton)
							.toBeTruthy();
					});

				it("should navigate to login when login button clicked",
					() =>
					{
						mockAuthService.setUser(null);
						fixture.detectChanges();

						component.navigateToLogin();

						expect(router.navigate)
							.toHaveBeenCalledWith(
								["/auth/login"]);
					});

				it("should navigate to register when register method called",
					() =>
					{
						mockAuthService.setUser(null);
						fixture.detectChanges();

						component.navigateToRegister();

						expect(router.navigate)
							.toHaveBeenCalledWith(
								["/auth/register"]);
					});

				it("should show user menu when authenticated",
					() =>
					{
						mockAuthService.setUser(
							createMockUserProfile(
								{
									id: 1,
									username: "testuser",
									email: "test@example.com",
									fullName: "John Doe"
								}));
						fixture.detectChanges();

						const compiled: HTMLElement =
							fixture.nativeElement;
						const userMenuButton: HTMLButtonElement | null =
							compiled.querySelector("[data-testid='user-menu-button']");

						expect(userMenuButton)
							.toBeTruthy();
					});

				it("should display user fullName in menu",
					async () =>
					{
						mockAuthService.setUser(
							createMockUserProfile(
								{
									fullName: "John Doe"
								}));
						fixture.detectChanges();

						// Open the user menu
						const userMenuButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(
								"[data-testid='user-menu-button']");
						userMenuButton?.click();
						fixture.detectChanges();
						await fixture.whenStable();

						// Menu content is rendered in overlay, query from document
						const userNameSpan: HTMLSpanElement | null =
							document.querySelector(
								"[data-testid='user-fullname']");

						expect(userNameSpan?.textContent?.trim())
							.toBe("John Doe");
					});

				it("should display username when fullName is null",
					async () =>
					{
						mockAuthService.setUser(
							createMockUserProfile(
								{
									username: "testuser",
									fullName: null
								}));
						fixture.detectChanges();

						// Open the user menu
						const userMenuButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(
								"[data-testid='user-menu-button']");
						userMenuButton?.click();
						fixture.detectChanges();
						await fixture.whenStable();

						// Menu content is rendered in overlay, query from document
						const userNameSpan: HTMLSpanElement | null =
							document.querySelector(
								"[data-testid='user-fullname']");

						expect(userNameSpan?.textContent?.trim())
							.toBe("testuser");
					});

				it("should call logout when logout clicked",
					() =>
					{
						mockAuthService.setUser(
							createMockUserProfile(
								{
									fullName: "John Doe"
								}));
						fixture.detectChanges();

						component.logout();

						expect(mockAuthService.logout)
							.toHaveBeenCalled();
					});

				it("should navigate to account page when navigateToAccount called",
					() =>
					{
						component.navigateToAccount();

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[APP_ROUTES.ACCOUNT.PROFILE]);
					});
			});

		describe("accessibility",
			() =>
			{
				it("should have role banner on toolbar",
					() =>
					{
						const toolbar: HTMLElement | null =
							fixture.nativeElement.querySelector("mat-toolbar");

						expect(toolbar?.getAttribute("role"))
							.toBe("banner");
					});

				it("should have aria-label on menu toggle button",
					() =>
					{
						const menuButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(".menu-toggle");

						expect(menuButton?.getAttribute("aria-label"))
							.toBe("Toggle navigation menu");
					});

				it("should have aria-hidden on decorative icons",
					() =>
					{
						const icons: NodeListOf<HTMLElement> =
							fixture.nativeElement.querySelectorAll("mat-icon");

						icons.forEach(
							(icon: HTMLElement) =>
							{
								expect(icon.getAttribute("aria-hidden"))
									.toBe("true");
							});
					});

				it("should have aria-label on theme toggle buttons",
					() =>
					{
						const brightnessButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(
								"[aria-label='Toggle brightness']");
						const colorSchemeButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(
								"[aria-label='Toggle color scheme']");

						expect(brightnessButton)
							.toBeTruthy();
						expect(colorSchemeButton)
							.toBeTruthy();
					});
			});
	});
