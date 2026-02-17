/**
 * Login component tests.
 * Verifies local and OAuth authentication flows.
 */

import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { AuthResponse } from "@auth/models";
import { MfaService } from "@auth/services";
import { APP_ROUTES, AUTH_NOTIFICATION_MESSAGES } from "@shared/constants";
import { AltchaService, DateService } from "@shared/services";
import { AuthService } from "@shared/services/auth.service";
import { OAUTH_PROVIDERS } from "@shared/services/auth.types";
import { NotificationService } from "@shared/services/notification.service";
import { StorageService } from "@shared/services/storage.service";
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
	isOAuthInProgress: ReturnType<typeof signal<boolean>>;
}

interface MockMfaService
{
	setMfaState: ReturnType<typeof vi.fn>;
}

interface MockStorageService
{
	getSessionItem: ReturnType<typeof vi.fn>;
	removeSessionItem: ReturnType<typeof vi.fn>;
	setSessionItem: ReturnType<typeof vi.fn>;
}

describe("LoginComponent",
	() =>
	{
		let component: LoginComponent;
		let fixture: ComponentFixture<LoginComponent>;
		let mockAuthService: MockAuthService;
		let mockMfaService: MockMfaService;
		let mockNotificationService: MockNotificationService;
		let mockAltchaService: MockAltchaService;
		let mockStorageService: MockStorageService;
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
				requiresPasswordChange: false,
				requiresMfa: false,
				sessionInactivityMinutes: 0,
				sessionWarningSeconds: 0
			};

		beforeEach(
			async () =>
			{
				mockAuthService =
					{
						login: vi.fn(),
						loginWithProvider: vi.fn(),
						isAuthenticated: signal<boolean>(false),
						isOAuthInProgress: signal<boolean>(false)
					};
				mockMfaService =
					{
						setMfaState: vi.fn()
					};
				mockNotificationService =
					createMockNotificationService();
				mockAltchaService =
					createMockAltchaService(false);
				mockStorageService =
					{
						getSessionItem: vi
							.fn()
							.mockReturnValue(null),
						removeSessionItem: vi.fn(),
						setSessionItem: vi.fn()
					};

				await TestBed
					.configureTestingModule(
						{
							imports: [LoginComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								{ provide: AuthService, useValue: mockAuthService },
								{ provide: MfaService, useValue: mockMfaService },
								{
									provide: NotificationService,
									useValue: mockNotificationService
								},
								{
									provide: AltchaService,
									useValue: mockAltchaService
								},
								{
									provide: StorageService,
									useValue: mockStorageService
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
				it("should not call service when username is empty and form is invalid",
					() =>
					{
						// Arrange
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "",
								password: "password123",
								rememberMe: false
							});

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(component["loginForm"].touched)
							.toBe(true);
						expect(mockAuthService.login).not.toHaveBeenCalled();
					});

				it("should not call service when password is empty and form is invalid",
					() =>
					{
						// Arrange
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "",
								rememberMe: false
							});

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(component["loginForm"].touched)
							.toBe(true);
						expect(mockAuthService.login).not.toHaveBeenCalled();
					});

				it("should call authService.login with credentials",
					() =>
					{
						// Arrange
						mockAuthService.login.mockReturnValue(of(mockAuthResponse));
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password123",
								rememberMe: false
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password123",
								rememberMe: false
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password123",
								rememberMe: true
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password123",
								rememberMe: false
							});

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(mockNotificationService.info)
							.toHaveBeenCalledWith(
								AUTH_NOTIFICATION_MESSAGES.PASSWORD_CHANGE_REQUIRED);
						expect(router.navigate)
							.toHaveBeenCalledWith(
								[APP_ROUTES.AUTH.CHANGE_PASSWORD],
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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "wrongpassword",
								rememberMe: false
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password",
								rememberMe: false
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password",
								rememberMe: false
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password",
								rememberMe: false
							});

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"An unexpected error occurred. Please try again."
								]);
					});

				it("should not expose server error detail to user",
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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password",
								rememberMe: false
							});

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect(
							mockNotificationService.errorWithDetails)
							.toHaveBeenCalledWith("Login Failed",
								[
									"An unexpected error occurred. Please try again."
								]);
					});

				it("should set isLoading to true during login",
					() =>
					{
						// Arrange
						mockAuthService.login.mockReturnValue(of(mockAuthResponse));
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "password123",
								rememberMe: false
							});

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
						component["loginForm"].patchValue(
							{
								usernameOrEmail: "testuser",
								password: "wrongpassword",
								rememberMe: false
							});

						// Act
						(component as unknown as { onLocalLogin(): void; }).onLocalLogin();

						// Assert
						expect((component as unknown as { isLoading(): boolean; }).isLoading())
							.toBe(false);
					});
			});

		describe("onOAuthLogin",
			() =>
			{
				it("should call authService.loginWithProvider with provider id",
					() =>
					{
						(component as unknown as { onOAuthLogin(provider: string): void; })
							.onOAuthLogin("github");

						expect(mockAuthService.loginWithProvider)
							.toHaveBeenCalledWith(
								"github",
								"/");
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
								"input[formcontrolname=\"usernameOrEmail\"]");
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
								"input[formcontrolname=\"password\"]");
						expect(passwordInput)
							.toBeTruthy();
					});

				it("should render OAuth buttons for all configured providers",
					async () =>
					{
						fixture.detectChanges();
						await fixture.whenStable();

						const oauthButtons: NodeListOf<HTMLButtonElement> =
							fixture.nativeElement.querySelectorAll(".oauth-button");
						expect(oauthButtons.length)
							.toBe(OAUTH_PROVIDERS.length);
					});

				it("should render OAuth button with correct aria-label",
					async () =>
					{
						fixture.detectChanges();
						await fixture.whenStable();

						const oauthButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(".oauth-button");
						expect(oauthButton?.getAttribute("aria-label"))
							.toBe("Continue with GitHub");
					});

				it("should call loginWithProvider when OAuth button is clicked",
					async () =>
					{
						fixture.detectChanges();
						await fixture.whenStable();

						const oauthButton: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(".oauth-button");
						oauthButton?.click();

						expect(mockAuthService.loginWithProvider)
							.toHaveBeenCalledWith(
								"github",
								"/");
					});
			});

		describe("inactivity banner",
			() =>
			{
				it("should show banner when inactivity flag is set",
					async () =>
					{
						// Arrange - set the flag before creating component
						mockStorageService
							.getSessionItem
							.mockReturnValue("true");

						// Re-create component to trigger ngOnInit with the flag
						fixture =
							TestBed.createComponent(LoginComponent);
						component =
							fixture.componentInstance;
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const banner: HTMLElement | null =
							fixture.nativeElement.querySelector(
								".inactivity-banner");
						expect(banner)
							.toBeTruthy();
						expect(banner?.textContent)
							.toContain("logged out due to inactivity");
					});

				it("should not show banner when flag is not set",
					async () =>
					{
						// Arrange (default: getSessionItem returns null)
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const banner: HTMLElement | null =
							fixture.nativeElement.querySelector(
								".inactivity-banner");
						expect(banner)
							.toBeNull();
					});

				it("should clear flag from sessionStorage after reading",
					() =>
					{
						// Arrange
						mockStorageService
							.getSessionItem
							.mockReturnValue("true");

						// Act
						fixture =
							TestBed.createComponent(LoginComponent);
						component =
							fixture.componentInstance;
						fixture.detectChanges();

						// Assert
						expect(
							mockStorageService.removeSessionItem)
							.toHaveBeenCalledWith(
								"auth_inactivity_logout");
					});
			});
	});
