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
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import { createMockNotificationService } from "@testing";
import { ChangePasswordComponent } from "./change-password";

describe("ChangePasswordComponent",
	() =>
	{
		let component: ChangePasswordComponent;
		let fixture: ComponentFixture<ChangePasswordComponent>;
		let mockAuthService: jasmine.SpyObj<AuthService>;
		let mockNotificationService: jasmine.SpyObj<NotificationService>;
		let router: Router;
		let httpTestingController: HttpTestingController;

		beforeEach(
			async () =>
			{
				mockAuthService =
					jasmine.createSpyObj(
						"AuthService",
						["clearPasswordChangeRequirement"],
						{
							isAuthenticated: signal<boolean>(true),
							requiresPasswordChange: signal<boolean>(false)
						});
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
				spyOn(router, "navigate");
				spyOn(router, "navigateByUrl");
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
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "DifferentPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert
						expect(mockNotificationService.error)
						.toHaveBeenCalledWith(
							"Passwords do not match.");
					});

				it("should show error when password is too short",
					() =>
					{
						// Arrange
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "Short1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "Short1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert
						expect(mockNotificationService.error)
						.toHaveBeenCalledWith(
							"Password must be at least 8 characters.");
					});

				it("should call API with correct payload",
					() =>
					{
						// Arrange
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "NewPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/change-password`);
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
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "NewPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/change-password`);
						req.flush(null);

						// Assert
						expect(mockNotificationService.success)
						.toHaveBeenCalledWith(
							"Password changed successfully. Please log in again.");
						expect(
							mockAuthService.clearPasswordChangeRequirement)
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
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "NewPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request with error
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/change-password`);
						req.flush(
							{ detail: "Current password is incorrect." },
							{ status: 400, statusText: "Bad Request" });

						// Assert
						expect(mockNotificationService.error)
						.toHaveBeenCalledWith(
							"Current password is incorrect.");
					});

				it("should show default error message when API error has no detail",
					() =>
					{
						// Arrange
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "NewPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request with error without detail
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/change-password`);
						req.flush(null,
							{ status: 500, statusText: "Server Error" });

						// Assert
						expect(mockNotificationService.error)
						.toHaveBeenCalledWith(
							"Failed to change password. Please try again.");
					});

				it("should set isLoading to true during submission",
					() =>
					{
						// Arrange
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "NewPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Assert - isLoading should be true while request is pending
						expect((component as unknown as { isLoading(): boolean; }).isLoading())
						.toBe(true);

						// Complete the request
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/change-password`);
						req.flush(null);
					});

				it("should reset isLoading to false on error",
					() =>
					{
						// Arrange
						(component as unknown as { currentPassword: string; }).currentPassword = "oldpassword";
						(component as unknown as { newPassword: string; }).newPassword = "NewPassword1!";
						(component as unknown as { confirmPassword: string; }).confirmPassword = "NewPassword1!";

						// Act
						(component as unknown as { onSubmit(): void; }).onSubmit();

						// Complete the HTTP request with error
						const req: TestRequest =
							httpTestingController.expectOne(
								`${environment.apiUrl}/auth/change-password`);
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
								"input[name=\"currentPassword\"]");
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
								"input[name=\"newPassword\"]");
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
								"input[name=\"confirmPassword\"]");
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
