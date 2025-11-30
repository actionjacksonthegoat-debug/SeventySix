import { ComponentFixture } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { HeaderComponent } from "./header.component";
import { ThemeService } from "@infrastructure/services/theme.service";
import { LayoutService } from "@infrastructure/services/layout.service";
import { AuthService } from "@infrastructure/services/auth.service";
import { createMockThemeService, createMockAuthService } from "@testing/mocks";
import { ComponentTestBed } from "@testing";

describe("HeaderComponent", () =>
{
	let component: HeaderComponent;
	let fixture: ComponentFixture<HeaderComponent>;
	let mockThemeService: ReturnType<typeof createMockThemeService>;
	let mockLayoutService: jasmine.SpyObj<LayoutService>;
	let mockAuthService: ReturnType<typeof createMockAuthService>;
	let router: Router;

	beforeEach(async () =>
	{
		mockThemeService = createMockThemeService();
		mockLayoutService = jasmine.createSpyObj("LayoutService", [
			"toggleSidebar"
		]);
		mockAuthService = createMockAuthService();

		fixture = await new ComponentTestBed<HeaderComponent>()
			.withProvider(provideRouter([]))
			.withProvider({ provide: ThemeService, useValue: mockThemeService })
			.withProvider({
				provide: LayoutService,
				useValue: mockLayoutService
			})
			.withProvider({ provide: AuthService, useValue: mockAuthService })
			.build(HeaderComponent);

		component = fixture.componentInstance;
		router = fixture.debugElement.injector.get(Router);
		spyOn(router, "navigate");
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	it("should toggle sidebar", () =>
	{
		component.toggleSidebar();
		expect(mockLayoutService.toggleSidebar).toHaveBeenCalled();
	});

	it("should toggle brightness", () =>
	{
		spyOn(mockThemeService, "toggleBrightness");
		component.toggleBrightness();
		expect(mockThemeService.toggleBrightness).toHaveBeenCalled();
	});

	it("should toggle color scheme", () =>
	{
		spyOn(mockThemeService, "toggleColorScheme");
		component.toggleColorScheme();
		expect(mockThemeService.toggleColorScheme).toHaveBeenCalled();
	});

	describe("authentication", () =>
	{
		it("should show guest menu when not authenticated", () =>
		{
			mockAuthService.setUser(null);
			fixture.detectChanges();

			const compiled: HTMLElement = fixture.nativeElement;
			const guestMenuButton: HTMLButtonElement | null =
				compiled.querySelector("[data-testid='guest-menu-button']");

			expect(guestMenuButton).toBeTruthy();
		});

		it("should navigate to login when login button clicked", () =>
		{
			mockAuthService.setUser(null);
			fixture.detectChanges();

			component.navigateToLogin();

			expect(router.navigate).toHaveBeenCalledWith(["/auth/login"]);
		});

		it("should navigate to register when register method called", () =>
		{
			mockAuthService.setUser(null);
			fixture.detectChanges();

			component.navigateToRegister();

			expect(router.navigate).toHaveBeenCalledWith(["/auth/register"]);
		});

		it("should show user menu when authenticated", () =>
		{
			mockAuthService.setUser({
				id: 1,
				username: "testuser",
				email: "test@example.com",
				roles: [],
				fullName: "John Doe"
			});
			fixture.detectChanges();

			const compiled: HTMLElement = fixture.nativeElement;
			const userMenuButton: HTMLButtonElement | null =
				compiled.querySelector("[data-testid='user-menu-button']");

			expect(userMenuButton).toBeTruthy();
		});

		it("should display user fullName in menu", async () =>
		{
			mockAuthService.setUser({
				id: 1,
				username: "testuser",
				email: "test@example.com",
				roles: [],
				fullName: "John Doe"
			});
			fixture.detectChanges();

			// Open the user menu
			const userMenuButton: HTMLButtonElement | null =
				fixture.nativeElement.querySelector(
					"[data-testid='user-menu-button']"
				);
			userMenuButton?.click();
			fixture.detectChanges();
			await fixture.whenStable();

			// Menu content is rendered in overlay, query from document
			const userNameSpan: HTMLSpanElement | null = document.querySelector(
				"[data-testid='user-fullname']"
			);

			expect(userNameSpan?.textContent?.trim()).toBe("John Doe");
		});

		it("should display username when fullName is null", async () =>
		{
			mockAuthService.setUser({
				id: 1,
				username: "testuser",
				email: "test@example.com",
				roles: [],
				fullName: null
			});
			fixture.detectChanges();

			// Open the user menu
			const userMenuButton: HTMLButtonElement | null =
				fixture.nativeElement.querySelector(
					"[data-testid='user-menu-button']"
				);
			userMenuButton?.click();
			fixture.detectChanges();
			await fixture.whenStable();

			// Menu content is rendered in overlay, query from document
			const userNameSpan: HTMLSpanElement | null = document.querySelector(
				"[data-testid='user-fullname']"
			);

			expect(userNameSpan?.textContent?.trim()).toBe("testuser");
		});

		it("should call logout when logout clicked", () =>
		{
			mockAuthService.setUser({
				id: 1,
				username: "testuser",
				email: "test@example.com",
				roles: [],
				fullName: "John Doe"
			});
			fixture.detectChanges();

			component.logout();

			expect(mockAuthService.logout).toHaveBeenCalled();
		});

		it("should navigate to account page when navigateToAccount called", () =>
		{
			component.navigateToAccount();

			expect(router.navigate).toHaveBeenCalledWith(["/account"]);
		});
	});
});
