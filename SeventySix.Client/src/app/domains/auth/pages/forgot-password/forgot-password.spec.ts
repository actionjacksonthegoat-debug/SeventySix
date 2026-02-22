// Copyright (c) Aaron Slots. All rights reserved.

import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AltchaService } from "@shared/services";
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
import { ForgotPasswordComponent } from "./forgot-password";

interface MockAuthService
{
	requestPasswordReset: ReturnType<typeof vi.fn>;
}

describe("ForgotPasswordComponent",
	() =>
	{
		let fixture: ComponentFixture<ForgotPasswordComponent>;
		let component: ForgotPasswordComponent;
		let authServiceSpy: MockAuthService;
		let notificationSpy: MockNotificationService;
		let altchaSpy: MockAltchaService;

		beforeEach(
			async () =>
			{
				authServiceSpy =
					{ requestPasswordReset: vi.fn() };
				notificationSpy =
					createMockNotificationService();
				altchaSpy =
					createMockAltchaService(false);

				await TestBed
					.configureTestingModule(
						{
							imports: [ForgotPasswordComponent],
							providers: [
								provideZonelessChangeDetection(),

								provideRouter([]),
								provideHttpClient(),
								provideHttpClientTesting(),
								{
									provide: AuthService,
									useValue: authServiceSpy
								},
								{
									provide: NotificationService,
									useValue: notificationSpy
								},
								{
									provide: AltchaService,
									useValue: altchaSpy
								}
							]
						})
					.compileComponents();

				fixture =
					TestBed.createComponent(ForgotPasswordComponent);
				component =
					fixture.componentInstance;
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should show success message after submission",
			async () =>
			{
				// Arrange
				authServiceSpy.requestPasswordReset.mockReturnValue(of(undefined));
				component["forgotPasswordForm"].patchValue(
					{ email: "test@example.com" });

				// Act
				component["onSubmit"]();
				await fixture.whenStable();
				fixture.detectChanges();

				// Assert
				expect(component["submitted"]())
					.toBe(true);
				expect(notificationSpy.success)
					.toHaveBeenCalled();
			});

		it("should disable submit button when email is empty",
			() =>
			{
				// Arrange
				component["forgotPasswordForm"].patchValue(
					{ email: "" });
				fixture.detectChanges();

				// Act
				const compiled: HTMLElement =
					fixture.nativeElement;
				const submitButton: HTMLButtonElement | null =
					compiled.querySelector(
						"button[type=\"submit\"]");

				// Assert
				expect(submitButton?.disabled)
					.toBe(true);
			});

		it("should enable submit button when email is valid",
			() =>
			{
				// Arrange
				component["forgotPasswordForm"].patchValue(
					{ email: "test@example.com" });
				fixture.detectChanges();

				// Act
				const compiled: HTMLElement =
					fixture.nativeElement;
				const submitButton: HTMLButtonElement | null =
					compiled.querySelector(
						"button[type=\"submit\"]");

				// Assert
				expect(submitButton?.disabled)
					.toBe(false);
			});

		it("should call requestPasswordReset with email and null payload when ALTCHA disabled",
			async () =>
			{
				// Arrange
				authServiceSpy.requestPasswordReset.mockReturnValue(of(undefined));
				component["forgotPasswordForm"].patchValue(
					{ email: "user@example.com" });

				// Act
				component["onSubmit"]();
				await fixture.whenStable();

				// Assert
				expect(authServiceSpy.requestPasswordReset)
					.toHaveBeenCalledWith(
						"user@example.com",
						null);
			});

		it("should show error notification on API failure",
			async () =>
			{
				// Arrange
				authServiceSpy.requestPasswordReset.mockReturnValue(
					throwError(
						() => new Error("Network error")));
				component["forgotPasswordForm"].patchValue(
					{ email: "test@example.com" });

				// Act
				component["onSubmit"]();
				await fixture.whenStable();
				fixture.detectChanges();

				// Assert
				expect(component["isLoading"]())
					.toBe(false);
				expect(notificationSpy.error)
					.toHaveBeenCalled();
			});

		it("should not submit when email format is invalid",
			() =>
			{
				// Arrange
				component["forgotPasswordForm"].patchValue(
					{ email: "invalid-email" });
				component["forgotPasswordForm"].markAllAsTouched();
				fixture.detectChanges();

				// Act
				component["onSubmit"]();

				// Assert
				expect(authServiceSpy.requestPasswordReset).not.toHaveBeenCalled();
			});
	});