/**
 * Change password component tests.
 * Verifies required and voluntary password change flows.
 */

import {
	provideHttpClient,
	withInterceptorsFromDi
} from "@angular/common/http";
import {
	HttpTestingController,
	provideHttpClientTesting,
	TestRequest
} from "@angular/common/http/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { environment } from "@environments/environment";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { createMockNotificationService } from "@shared/testing";
import { vi } from "vitest";
import { ChangePasswordComponent } from "./change-password";

interface MockAuthService
{
	clearPasswordChangeRequirement: ReturnType<typeof vi.fn>;
	forceLogoutLocally: ReturnType<typeof vi.fn>;
	isAuthenticated: ReturnType<typeof signal<boolean>>;
	requiresPasswordChange: ReturnType<typeof signal<boolean>>;
}

interface MockNotificationService
{
	success: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	info: ReturnType<typeof vi.fn>;
	warning: ReturnType<typeof vi.fn>;
	errorWithDetails: ReturnType<typeof vi.fn>;
}

describe("ChangePasswordComponent",
	() =>
	{
		let component: ChangePasswordComponent;
		let fixture: ComponentFixture<ChangePasswordComponent>;
		let mockAuthService: MockAuthService;
		let mockNotificationService: MockNotificationService;
		let router: Router;
		let httpTestingController: HttpTestingController;

		beforeEach(
			async () =>
			{
				mockAuthService =
					{
						clearPasswordChangeRequirement: vi.fn(),
						forceLogoutLocally: vi.fn(),
						isAuthenticated: signal<boolean>(true),
						requiresPasswordChange: signal<boolean>(false)
					};
				mockNotificationService =
					createMockNotificationService();

				await TestBed
					.configureTestingModule(
						{
							imports: [ChangePasswordComponent],
							providers: [
								provideZonelessChangeDetection(),
								provideRouter([]),
								provideHttpClient(withInterceptorsFromDi()),
								provideHttpClientTesting(),
								{ provide: AuthService, useValue: mockAuthService },
								{
									provide: NotificationService,
									useValue: mockNotificationService
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ChangePasswordComponent);
				component =
					fixture.componentInstance;
				router =
					TestBed.inject(Router);
				vi.spyOn(router, "navigate");
				vi.spyOn(router, "navigateByUrl");
				httpTestingController =
					TestBed.inject(HttpTestingController);
				fixture.detectChanges();
			});

		afterEach(
			() =>
			{
				httpTestingController.verify();
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
				it("should not redirect when authenticated",
					() =>
					{
						// The default setup has isAuthenticated = true
						// Verify navigate was not called to login
						expect(router.navigate).not.toHaveBeenCalledWith(
							["/auth/login"]);
					});
			});

		describe("onSubmit",
			() =>
			{
				it("should show error when passwords do not match",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "DifferentPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert
						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"Passwords do not match.");
					});

				it("should not call API when password is too short and form is invalid",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "Short1!",
								confirmPassword: "Short1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert - Form should be marked as touched and no HTTP calls made
						expect(component["changePasswordForm"].touched)
							.toBe(true);
						expect(httpTestingController.match("/api/auth/password/change").length)
							.toBe(0);
					});

				it("should call API with correct payload",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "NewPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/password/change`);
						expect(req.request.method)
							.toBe("POST");
						expect(req.request.body)
							.toEqual(
								{
									currentPassword: "oldpassword",
									newPassword: "NewPassword1!"
								});
						expect(req.request.withCredentials)
							.toBe(true);

						// Complete the request
						req.flush(null);
					});

				it("should show success notification and navigate to login on success",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "NewPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/password/change`);
						req.flush(null);

						// Assert
						expect(mockNotificationService.success)
							.toHaveBeenCalledWith(
								"Password changed successfully. Please log in again.");
						expect(
							mockAuthService.forceLogoutLocally)
							.toHaveBeenCalled();
						expect(router.navigate)
							.toHaveBeenCalledWith(
								["/auth/login"],
								{
									queryParams: { returnUrl: "/" }
								});
					});

				it("should show error notification on API failure",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "NewPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request with error
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/password/change`);
						req.flush(
							{ detail: "Current password is incorrect." },
							{ status: 400, statusText: "Bad Request" });

						// Assert
						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"Invalid request. Please check your input.");
					});

				it("should show default error message when API error has no detail",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "NewPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request with error without detail
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/password/change`);
						req.flush(null,
							{ status: 500, statusText: "Server Error" });

						// Assert
						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"An unexpected error occurred. Please try again.");
					});

				it("should set isLoading to true during submission",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "NewPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert - isLoading should be true while request is pending
						expect((component as unknown as { isLoading(): boolean; }).isLoading())
							.toBe(true);

						// Complete the request
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/password/change`);
						req.flush(null);
					});

				it("should reset isLoading to false on error",
					() =>
					{
						// Arrange
						component["changePasswordForm"].patchValue(
							{
								currentPassword: "oldpassword",
								newPassword: "NewPassword1!",
								confirmPassword: "NewPassword1!"
							});

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request with error
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/password/change`);
						req.flush(null,
							{ status: 500, statusText: "Server Error" });

						// Assert
						expect((component as unknown as { isLoading(): boolean; }).isLoading())
							.toBe(false);
					});
			});

		describe("template",
			() =>
			{
				it("should render change password card",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const card: HTMLElement | null =
							fixture.nativeElement.querySelector(".change-password-card");
						expect(card)
							.toBeTruthy();
					});

				it("should render current password input",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const input: HTMLInputElement | null =
							fixture.nativeElement.querySelector(
								"input[formcontrolname=\"currentPassword\"]");
						expect(input)
							.toBeTruthy();
						expect(input?.type)
							.toBe("password");
					});

				it("should render new password input",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const input: HTMLInputElement | null =
							fixture.nativeElement.querySelector(
								"input[formcontrolname=\"newPassword\"]");
						expect(input)
							.toBeTruthy();
						expect(input?.type)
							.toBe("password");
					});

				it("should render confirm password input",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const input: HTMLInputElement | null =
							fixture.nativeElement.querySelector(
								"input[formcontrolname=\"confirmPassword\"]");
						expect(input)
							.toBeTruthy();
						expect(input?.type)
							.toBe("password");
					});

				it("should render submit button",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const button: HTMLButtonElement | null =
							fixture.nativeElement.querySelector(".submit-button");
						expect(button)
							.toBeTruthy();
					});

				it("should show required notice when isRequired is true",
					async () =>
					{
						// Arrange
						(component as unknown as { isRequired: { set(value: boolean): void; }; }).isRequired.set(true);
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const notice: HTMLElement | null =
							fixture.nativeElement.querySelector(".required-notice");
						expect(notice)
							.toBeTruthy();
						expect(notice?.textContent)
							.toContain(
								"You must change your password before continuing.");
					});

				it("should not show required notice when isRequired is false",
					async () =>
					{
						// Arrange
						(component as unknown as { isRequired: { set(value: boolean): void; }; }).isRequired.set(false);
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const notice: HTMLElement | null =
							fixture.nativeElement.querySelector(".required-notice");
						expect(notice)
							.toBeFalsy();
					});

				it("should render password hint",
					async () =>
					{
						// Arrange
						fixture.detectChanges();
						await fixture.whenStable();

						// Assert
						const hint: HTMLElement | null =
							fixture.nativeElement.querySelector(".hint");
						expect(hint)
							.toBeTruthy();
						expect(hint?.textContent)
							.toContain("At least 8 characters");
					});
			});
	});
