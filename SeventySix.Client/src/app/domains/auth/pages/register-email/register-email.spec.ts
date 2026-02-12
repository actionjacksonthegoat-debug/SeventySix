/**
 * Register email component tests.
 * Verifies email form validation, Altcha integration, and enumeration-safe submission.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { environment } from "@environments/environment";
import { AltchaService } from "@shared/services/altcha.service";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { createMockNotificationService } from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { RegisterEmailComponent } from "./register-email";

interface MockAltchaService
{
	enabled: boolean;
	challengeEndpoint: string;
}

interface MockAuthService
{
	initiateRegistration: ReturnType<typeof vi.fn>;
}

describe("RegisterEmailComponent",
	() =>
	{
		let component: RegisterEmailComponent;
		let fixture: ComponentFixture<RegisterEmailComponent>;
		let mockNotificationService: ReturnType<typeof createMockNotificationService>;
		let mockAltchaService: MockAltchaService;
		let mockAuthService: MockAuthService;

		function createComponent(altchaEnabled: boolean = false): void
		{
			mockAltchaService =
				{
					enabled: altchaEnabled,
					challengeEndpoint: `${environment.apiUrl}/altcha/challenge`
				};
			mockAuthService =
				{
					initiateRegistration: vi
						.fn()
						.mockReturnValue(of(undefined))
				};
			mockNotificationService =
				createMockNotificationService();

			TestBed
				.configureTestingModule(
					{
						imports: [RegisterEmailComponent],
						providers: [
							provideZonelessChangeDetection(),
							provideRouter([]),
							{ provide: AuthService, useValue: mockAuthService },
							{ provide: AltchaService, useValue: mockAltchaService },
							{
								provide: NotificationService,
								useValue: mockNotificationService
							}
						]
					});

			fixture =
				TestBed.createComponent(RegisterEmailComponent);
			component =
				fixture.componentInstance;
			fixture.detectChanges();
		}

		describe("without Altcha",
			() =>
			{
				beforeEach(
					() => createComponent(false));

				it("should create",
					() =>
					{
						expect(component)
							.toBeTruthy();
					});

				it("should render email input",
					() =>
					{
						const emailInput: HTMLInputElement | null =
							fixture.nativeElement.querySelector(
								"input[formControlName='email']");

						expect(emailInput)
							.toBeTruthy();
					});

				it("should have invalid form when email is empty",
					() =>
					{
						expect(component["canSubmit"]())
							.toBe(false);
					});

				it("should have valid form with proper email",
					() =>
					{
						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						expect(component["canSubmit"]())
							.toBe(true);
					});

				it("should call initiateRegistration on submit",
					() =>
					{
						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						component["onSubmit"]();

						expect(mockAuthService.initiateRegistration)
							.toHaveBeenCalledWith(
								"test@example.com",
								null);
					});

				it("should show submitted state after successful submit",
					() =>
					{
						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						component["onSubmit"]();

						expect(component["submitted"]())
							.toBe(true);
					});

				it("should show submitted state even on error to prevent enumeration",
					() =>
					{
						mockAuthService.initiateRegistration.mockReturnValue(
							throwError(
								() => ({ status: 400 })));

						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						component["onSubmit"]();

						expect(component["submitted"]())
							.toBe(true);
					});
			});

		describe("with Altcha enabled",
			() =>
			{
				beforeEach(
					() => createComponent(true));

				it("should block submit when Altcha not completed",
					() =>
					{
						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						expect(component["canSubmit"]())
							.toBe(false);
					});

				it("should allow submit after Altcha verified",
					() =>
					{
						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						component["onAltchaVerified"]("altcha-payload-token");

						expect(component["canSubmit"]())
							.toBe(true);
					});

				it("should show error notification when submitting without Altcha",
					() =>
					{
						component["registerForm"].patchValue(
							{ email: "test@example.com" });

						// Force submit with altcha missing
						component["altchaPayload"].set(null);
						component["onSubmit"]();

						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"Please complete the verification challenge.");
					});
			});
	});
