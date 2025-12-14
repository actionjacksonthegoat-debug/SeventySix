// Copyright (c) Aaron Slots. All rights reserved.

import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { provideRouter } from "@angular/router";
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import { of, throwError } from "rxjs";
import { ForgotPasswordComponent } from "./forgot-password";

describe("ForgotPasswordComponent",
	() =>
	{
		let fixture: ComponentFixture<ForgotPasswordComponent>;
		let component: ForgotPasswordComponent;
		let authServiceSpy: jasmine.SpyObj<AuthService>;
		let notificationSpy: jasmine.SpyObj<NotificationService>;

		beforeEach(
			async () =>
			{
				authServiceSpy =
					jasmine.createSpyObj("AuthService",
						[
							"requestPasswordReset"
						]);
				notificationSpy =
					jasmine.createSpyObj("NotificationService",
						[
							"success",
							"error"
						]);

				await TestBed
				.configureTestingModule(
					{
						imports: [ForgotPasswordComponent],
						providers: [
							provideZonelessChangeDetection(),
							provideNoopAnimations(),
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
				authServiceSpy.requestPasswordReset.and.returnValue(of(undefined));
				component["email"] = "test@example.com";

				// Act
				component["onSubmit"]();
				await fixture.whenStable();
				fixture.detectChanges();

				// Assert
				expect(component["submitted"]())
				.toBeTrue();
				expect(notificationSpy.success)
				.toHaveBeenCalled();
			});

		it("should disable submit button when email is empty",
			() =>
			{
				// Arrange
				component["email"] = "";
				fixture.detectChanges();

				// Act
				const compiled: HTMLElement =
					fixture.nativeElement;
				const submitButton: HTMLButtonElement | null =
					compiled.querySelector(
						"button[type=\"submit\"]");

				// Assert
				expect(submitButton?.disabled)
				.toBeTrue();
			});

		it("should enable submit button when email is valid",
			() =>
			{
				// Arrange
				component["email"] = "test@example.com";
				fixture.detectChanges();

				// Act
				const compiled: HTMLElement =
					fixture.nativeElement;
				const submitButton: HTMLButtonElement | null =
					compiled.querySelector(
						"button[type=\"submit\"]");

				// Assert
				expect(submitButton?.disabled)
				.toBeFalse();
			});

		it("should call requestPasswordReset with email",
			() =>
			{
				// Arrange
				authServiceSpy.requestPasswordReset.and.returnValue(of(undefined));
				component["email"] = "user@example.com";

				// Act
				component["onSubmit"]();

				// Assert
				expect(authServiceSpy.requestPasswordReset)
				.toHaveBeenCalledWith(
					"user@example.com");
			});

		it("should show error notification on API failure",
			async () =>
			{
				// Arrange
				authServiceSpy.requestPasswordReset.and.returnValue(
					throwError(
						() => new Error("Network error")));
				component["email"] = "test@example.com";

				// Act
				component["onSubmit"]();
				await fixture.whenStable();
				fixture.detectChanges();

				// Assert
				expect(component["isLoading"]())
				.toBeFalse();
				expect(notificationSpy.error)
				.toHaveBeenCalled();
			});

		it("should not submit when email format is invalid",
			() =>
			{
				// Arrange
				component["email"] = "invalid-email";
				fixture.detectChanges();

				// Act
				component["onSubmit"]();

				// Assert
				expect(authServiceSpy.requestPasswordReset).not.toHaveBeenCalled();
				expect(notificationSpy.error)
				.toHaveBeenCalledWith(
					"Please enter a valid email address.");
			});
	});
