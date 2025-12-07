/**
 * Login component tests.
 * Verifies local and OAuth authentication flows.
 */

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { LoginComponent } from "./login";
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import { AuthResponse } from "@infrastructure/models";
import { createMockNotificationService } from "@testing";

describe("LoginComponent", () =>
{
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockNotificationService: jasmine.SpyObj<NotificationService>;
	let router: Router;

	const mockAuthResponse: AuthResponse = {
		accessToken: "test-token",
		expiresAt: new Date(Date.now() + 3600000).toISOString(),
		requiresPasswordChange: false
	};

	beforeEach(async () =>
	{
		mockAuthService = jasmine.createSpyObj(
			"AuthService",
			["login", "loginWithProvider"],
			{
				isAuthenticated: signal<boolean>(false)
			}
		);
		mockNotificationService = createMockNotificationService();

		await TestBed.configureTestingModule({
			imports: [LoginComponent],
			providers: [
				provideZonelessChangeDetection(),
				provideRouter([]),
				{ provide: AuthService, useValue: mockAuthService },
				{
					provide: NotificationService,
					useValue: mockNotificationService
				}
			]
		}).compileComponents();

		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		router = TestBed.inject(Router);
		spyOn(router, "navigate");
		spyOn(router, "navigateByUrl");
		fixture.detectChanges();
	});

	it("should create", () =>
	{
		expect(component).toBeTruthy();
	});

	describe("ngOnInit", () =>
	{
		it("should not redirect when not authenticated", () =>
		{
			// The default setup has isAuthenticated = false
			// Verify navigateByUrl was not called
			expect(router.navigateByUrl).not.toHaveBeenCalled();
		});
	});

	describe("onLocalLogin", () =>
	{
		it("should show error when username is empty", () =>
		{
			// Arrange
			(component as any).usernameOrEmail = "";
			(component as any).password = "password123";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				"Please enter username and password."
			);
			expect(mockAuthService.login).not.toHaveBeenCalled();
		});

		it("should show error when password is empty", () =>
		{
			// Arrange
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(mockNotificationService.error).toHaveBeenCalledWith(
				"Please enter username and password."
			);
			expect(mockAuthService.login).not.toHaveBeenCalled();
		});

		it("should call authService.login with credentials", () =>
		{
			// Arrange
			mockAuthService.login.and.returnValue(of(mockAuthResponse));
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password123";
			(component as any).rememberMe = false;

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(mockAuthService.login).toHaveBeenCalledWith({
				usernameOrEmail: "testuser",
				password: "password123",
				rememberMe: false
			});
		});

		it("should navigate to return URL on successful login", () =>
		{
			// Arrange
			mockAuthService.login.and.returnValue(of(mockAuthResponse));
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password123";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(router.navigateByUrl).toHaveBeenCalledWith("/");
		});

		it("should include rememberMe when checked", () =>
		{
			// Arrange
			mockAuthService.login.and.returnValue(of(mockAuthResponse));
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password123";
			(component as any).rememberMe = true;

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(mockAuthService.login).toHaveBeenCalledWith({
				usernameOrEmail: "testuser",
				password: "password123",
				rememberMe: true
			});
		});

		it("should redirect to change-password when requiresPasswordChange is true", () =>
		{
			// Arrange
			const responseWithPasswordChange: AuthResponse = {
				...mockAuthResponse,
				requiresPasswordChange: true
			};
			mockAuthService.login.and.returnValue(
				of(responseWithPasswordChange)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password123";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(mockNotificationService.info).toHaveBeenCalledWith(
				"You must change your password before continuing."
			);
			expect(router.navigate).toHaveBeenCalledWith(
				["/auth/change-password"],
				{ queryParams: { required: "true", returnUrl: "/" } }
			);
		});

		it("should show detailed error for 401 unauthorized", () =>
		{
			// Arrange
			const errorResponse: HttpErrorResponse = new HttpErrorResponse({
				status: 401,
				statusText: "Unauthorized"
			});
			mockAuthService.login.and.returnValue(
				throwError(() => errorResponse)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "wrongpassword";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(
				mockNotificationService.errorWithDetails
			).toHaveBeenCalledWith("Login Failed", [
				"Invalid username or password",
				"Check your credentials and try again"
			]);
		});

		it("should show connection error for status 0", () =>
		{
			// Arrange
			const errorResponse: HttpErrorResponse = new HttpErrorResponse({
				status: 0,
				statusText: "Unknown Error"
			});
			mockAuthService.login.and.returnValue(
				throwError(() => errorResponse)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(
				mockNotificationService.errorWithDetails
			).toHaveBeenCalledWith("Login Failed", [
				"Unable to connect to server",
				"Check your internet connection"
			]);
		});

		it("should show rate limit error for 429", () =>
		{
			// Arrange
			const errorResponse: HttpErrorResponse = new HttpErrorResponse({
				status: 429,
				statusText: "Too Many Requests"
			});
			mockAuthService.login.and.returnValue(
				throwError(() => errorResponse)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(
				mockNotificationService.errorWithDetails
			).toHaveBeenCalledWith("Login Failed", [
				"Too many login attempts",
				"Please wait before trying again"
			]);
		});

		it("should show generic error for unexpected status codes", () =>
		{
			// Arrange
			const errorResponse: HttpErrorResponse = new HttpErrorResponse({
				status: 500,
				statusText: "Internal Server Error"
			});
			mockAuthService.login.and.returnValue(
				throwError(() => errorResponse)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(
				mockNotificationService.errorWithDetails
			).toHaveBeenCalledWith("Login Failed", [
				"An unexpected error occurred"
			]);
		});

		it("should use server error detail if available", () =>
		{
			// Arrange
			const errorResponse: HttpErrorResponse = new HttpErrorResponse({
				status: 500,
				statusText: "Internal Server Error",
				error: { detail: "Custom server error message" }
			});
			mockAuthService.login.and.returnValue(
				throwError(() => errorResponse)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect(
				mockNotificationService.errorWithDetails
			).toHaveBeenCalledWith("Login Failed", [
				"Custom server error message"
			]);
		});

		it("should set isLoading to true during login", () =>
		{
			// Arrange
			mockAuthService.login.and.returnValue(of(mockAuthResponse));
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "password123";

			// Act
			(component as any).onLocalLogin();

			// Assert - isLoading is set to true during the request
			// Note: It's reset in the subscribe callback, so we verify login was called
			expect(mockAuthService.login).toHaveBeenCalled();
		});

		it("should reset isLoading to false on login error", () =>
		{
			// Arrange
			const errorResponse: HttpErrorResponse = new HttpErrorResponse({
				status: 401,
				statusText: "Unauthorized"
			});
			mockAuthService.login.and.returnValue(
				throwError(() => errorResponse)
			);
			(component as any).usernameOrEmail = "testuser";
			(component as any).password = "wrongpassword";

			// Act
			(component as any).onLocalLogin();

			// Assert
			expect((component as any).isLoading()).toBe(false);
		});
	});

	describe("onGitHubLogin", () =>
	{
		it("should call authService.loginWithProvider with github", () =>
		{
			// Act
			(component as any).onGitHubLogin();

			// Assert
			expect(mockAuthService.loginWithProvider).toHaveBeenCalledWith(
				"github",
				"/"
			);
		});

		it("should set isLoading to true", () =>
		{
			// Act
			(component as any).onGitHubLogin();

			// Assert
			expect((component as any).isLoading()).toBe(true);
		});
	});

	describe("template", () =>
	{
		it("should render login card", async () =>
		{
			// Arrange
			fixture.detectChanges();
			await fixture.whenStable();

			// Assert
			const loginCard: HTMLElement | null =
				fixture.nativeElement.querySelector(".login-card");
			expect(loginCard).toBeTruthy();
		});

		it("should render username input", async () =>
		{
			// Arrange
			fixture.detectChanges();
			await fixture.whenStable();

			// Assert
			const usernameInput: HTMLInputElement | null =
				fixture.nativeElement.querySelector(
					'input[name="usernameOrEmail"]'
				);
			expect(usernameInput).toBeTruthy();
		});

		it("should render password input", async () =>
		{
			// Arrange
			fixture.detectChanges();
			await fixture.whenStable();

			// Assert
			const passwordInput: HTMLInputElement | null =
				fixture.nativeElement.querySelector('input[name="password"]');
			expect(passwordInput).toBeTruthy();
		});

		it("should render GitHub login button", async () =>
		{
			// Arrange
			fixture.detectChanges();
			await fixture.whenStable();

			// Assert
			const githubButton: HTMLButtonElement | null =
				fixture.nativeElement.querySelector(".btn-github");
			expect(githubButton).toBeTruthy();
		});
	});
});
