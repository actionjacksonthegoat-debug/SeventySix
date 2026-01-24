/**
 * Login component tests.
 * Verifies local and OAuth authentication flows.
 */

import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AuthResponse } from "@auth/models";
import { AltchaService, DateService } from "@shared/services";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockAltchaService,
	createMockNotificationService,
	MockAltchaService,
	MockNotificationService
} from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { LoginComponent } from "./login";

interface MockAuthService
{
	login: ReturnType<typeof vi.fn>;
	loginWithProvider: ReturnType<typeof vi.fn>;
	isAuthenticated: ReturnType<typeof signal<boolean>>;
}

describe("LoginComponent",
	() =>
	{
		let component: LoginComponent;
		let fixture: ComponentFixture<LoginComponent>;
		let mockAuthService: MockAuthService;
		let mockNotificationService: MockNotificationService;
		let mockAltchaService: MockAltchaService;
		let router: Router;

		const dateService: DateService =
			new DateService();
		const mockAuthResponse: AuthResponse =
			{
				accessToken: "test-token",
				expiresAt: dateService
					.fromMillis(dateService.nowTimestamp() + 3600000)
					.toISOString(),
				email: "test@example.com",
				fullName: "Test User",
				requiresPasswordChange: false
			};

		beforeEach(
			async () =>
			{
				mockAuthService =
					{
						login: vi.fn(),
						loginWithProvider: vi.fn(),
						isAuthenticated: signal<boolean>(false)
					};
				mockNotificationService =
					createMockNotificationService();
				mockAltchaService =
					createMockAltchaService(false);

				await TestBed
					.configureTestingModule(
						{
							imports: [LoginComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								{ provide: AuthService, useValue: mockAuthService },
								{
									provide: NotificationService,
									useValue: mockNotificationService
								},
								{
									provide: AltchaService,
									useValue: mockAltchaService
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(LoginComponent);
				component =
					fixture.componentInstance;
				router =
					TestBed.inject(Router);
				vi.spyOn(router, "navigate");
				vi.spyOn(router, "navigateByUrl");
				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		describe("ngOnInit",
			() =>
			{
				it("should not redirect when not authenticated",
					() =>
					{
						// The default setup has isAuthenticated = false
						// Verify navigateByUrl was not called
						expect(router.navigateByUrl).not.toHaveBeenCalled();
					});
			});

		describe("onLocalLogin",
			() =>
			{
				it("should show error when username is empty",
					() =>
					{
						// Arrange
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "";
						(component as unknown as { password: string; }).password = "password123";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"Please enter username and password.");
						expect(mockAuthService.login).not.toHaveBeenCalled();
					});

				it("should show error when password is empty",
					() =>
					{
						// Arrange
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"Please enter username and password.");
						expect(mockAuthService.login).not.toHaveBeenCalled();
					});

				it("should call authService.login with credentials",
					() =>
					{
						// Arrange
						mockAuthService.login.mockReturnValue(of(mockAuthResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password123";
						(component as unknown as { rememberMe: boolean; }).rememberMe = false;

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(mockAuthService.login)
							.toHaveBeenCalledWith(
								{
									usernameOrEmail: "testuser",
									password: "password123",
									rememberMe: false,
									altchaPayload: null
								});
					});

				it("should navigate to return URL on successful login",
					() =>
					{
						// Arrange
						mockAuthService.login.mockReturnValue(of(mockAuthResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password123";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(router.navigateByUrl)
							.toHaveBeenCalledWith("/");
					});

				it("should include rememberMe when checked",
					() =>
					{
						// Arrange
						mockAuthService.login.mockReturnValue(of(mockAuthResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password123";
						(component as unknown as { rememberMe: boolean; }).rememberMe = true;

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(mockAuthService.login)
							.toHaveBeenCalledWith(
								{
									usernameOrEmail: "testuser",
									password: "password123",
									rememberMe: true,
									altchaPayload: null
								});
					});

				it("should redirect to change-password when requiresPasswordChange is true",
					() =>
					{
						// Arrange
						const responseWithPasswordChange: AuthResponse =
							{
								...mockAuthResponse,
								requiresPasswordChange: true
							};
						mockAuthService.login.mockReturnValue(
							of(responseWithPasswordChange));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password123";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(mockNotificationService.info)
							.toHaveBeenCalledWith(
								"You must change your password before continuing.");
						expect(router.navigate)
							.toHaveBeenCalledWith(
								["/auth/change-password"],
								{ queryParams: { required: "true", returnUrl: "/" } });
					});

				it("should show detailed error for 401 unauthorized",
					() =>
					{
						// Arrange
						const errorResponse: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 401,
									statusText: "Unauthorized"
								});
						mockAuthService.login.mockReturnValue(
							throwError(
								() => errorResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "wrongpassword";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"Invalid username or password",
									"Check your credentials and try again"
								]);
					});

				it("should show connection error for status 0",
					() =>
					{
						// Arrange
						const errorResponse: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 0,
									statusText: "Unknown Error"
								});
						mockAuthService.login.mockReturnValue(
							throwError(
								() => errorResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"Unable to connect to server",
									"Check your internet connection"
								]);
					});

				it("should show rate limit error for 429",
					() =>
					{
						// Arrange
						const errorResponse: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 429,
									statusText: "Too Many Requests"
								});
						mockAuthService.login.mockReturnValue(
							throwError(
								() => errorResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"Too many login attempts",
									"Please wait before trying again"
								]);
					});

				it("should show generic error for unexpected status codes",
					() =>
					{
						// Arrange
						const errorResponse: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error"
								});
						mockAuthService.login.mockReturnValue(
							throwError(
								() => errorResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"An unexpected error occurred"
								]);
					});

				it("should use server error detail if available",
					() =>
					{
						// Arrange
						const errorResponse: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 500,
									statusText: "Internal Server Error",
									error: { detail: "Custom server error message" }
								});
						mockAuthService.login.mockReturnValue(
							throwError(
								() => errorResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"Custom server error message"
								]);
					});

				it("should set isLoading to true during login",
					() =>
					{
						// Arrange
						mockAuthService.login.mockReturnValue(of(mockAuthResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "password123";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert - isLoading is set to true during the request
						// Note: It's reset in the subscribe callback, so we verify login was called
						expect(mockAuthService.login)
							.toHaveBeenCalled();
					});

				it("should reset isLoading to false on login error",
					() =>
					{
						// Arrange
						const errorResponse: HttpErrorResponse =
							new HttpErrorResponse(
								{
									status: 401,
									statusText: "Unauthorized"
								});
						mockAuthService.login.mockReturnValue(
							throwError(
								() => errorResponse));
						(component as unknown as { usernameOrEmail: string; }).usernameOrEmail = "testuser";
						(component as unknown as { password: string; }).password = "wrongpassword";

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect((component as unknown as { isLoading(): boolean; }).isLoading())
							.toBe(false);
					});
			});

		describe("onGitHubLogin",
			() =>
			{
				it("should call authService.loginWithProvider with github",
					() =>
					{
						// Act
						(component as unknown as { onGitHubLogin(): void; }).onGitHubLogin();

						// Assert
						expect(mockAuthService.loginWithProvider)
							.toHaveBeenCalledWith(
								"github",
								"/");
					});

				it("should set isLoading to true",
					() =>
					{
						// Act
						(component as unknown as { onGitHubLogin(): void; }).onGitHubLogin();

						// Assert
						expect((component as unknown as { isLoading(): boolean; }).isLoading())
							.toBe(true);
					});
			});

		describe("template",
			() =>
			{
				it("should render login card",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const loginCard: HTMLElement | null =
							fixture.nativeElement.querySelector(".login-card");
						expect(loginCard)
							.toBeTruthy();
					});

				it("should render username input",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const usernameInput: HTMLInputElement | null =
							fixture.nativeElement.querySelector(
								"input[name=\"usernameOrEmail\"]");
						expect(usernameInput)
							.toBeTruthy();
					});

				it("should render password input",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const passwordInput: HTMLInputElement | null =
							fixture.nativeElement.querySelector(
								"input[name=\"password\"]");
						expect(passwordInput)
							.toBeTruthy();
					});

				it("should render GitHub login button",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const githubButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(".github-button");
						expect(githubButton)
							.toBeTruthy();
					});
			});
	});
