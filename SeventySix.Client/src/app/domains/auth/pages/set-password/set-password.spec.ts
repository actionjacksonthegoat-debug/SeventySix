/**
 * Set password component tests.
 * Verifies token-based password reset flow (80/20 - core paths only).
 */

import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { createMockNotificationService } from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { SetPasswordComponent } from "./set-password";

interface MockAuthService
{
	setPassword: ReturnType<typeof vi.fn>;
}

interface MockNotificationService
{
	success: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	info: ReturnType<typeof vi.fn>;
	warning: ReturnType<typeof vi.fn>;
	errorWithDetails: ReturnType<typeof vi.fn>;
}

describe("SetPasswordComponent",
	() =>
	{
		let component: SetPasswordComponent;
		let fixture: ComponentFixture<SetPasswordComponent>;
		let mockAuthService: MockAuthService;
		let mockNotificationService: MockNotificationService;
		let router: Router;

		const validToken: string = "valid-reset-token-12345";

		function setupTestBed(queryParams: Record<string, string> = {}): void
		{
			TestBed.configureTestingModule(
				{
					imports: [SetPasswordComponent],
					providers: [
						provideZonelessChangeDetection(),
						provideRouter([]),
						{ provide: AuthService, useValue: mockAuthService },
						{
							provide: NotificationService,
							useValue: mockNotificationService
						},
						{
							provide: ActivatedRoute,
							useValue: { snapshot: { queryParams } }
						}
					]
				});

			fixture =
				TestBed.createComponent(SetPasswordComponent);
			component =
				fixture.componentInstance;
			router =
				TestBed.inject(Router);
			vi.spyOn(router, "navigate");
			fixture.detectChanges();
		}

		beforeEach(
			() =>
			{
				mockAuthService =
					{ setPassword: vi.fn() };
				mockNotificationService =
					createMockNotificationService();
			});

		it("should create",
			() =>
			{
				setupTestBed(
					{ token: validToken });
				expect(component)
					.toBeTruthy();
			});

		it("should show error when token is missing",
			() =>
			{
				setupTestBed({});

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith(
						"Invalid password reset link. Please request a new one.");
				expect((component as unknown as { tokenValid(): boolean; }).tokenValid())
					.toBe(false);
			});

		it("should show error when passwords do not match",
			() =>
			{
				setupTestBed(
					{ token: validToken });
				(component as unknown as { newPassword: string; }).newPassword = "Password123!";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "DifferentPassword123!";

				(component as unknown as { onSubmit(): void; }).onSubmit();

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith(
						"Passwords do not match.");
				expect(mockAuthService.setPassword).not.toHaveBeenCalled();
			});

		it("should navigate to login on successful password set",
			() =>
			{
				setupTestBed(
					{ token: validToken });
				mockAuthService.setPassword.mockReturnValue(of(undefined));
				(component as unknown as { newPassword: string; }).newPassword = "ValidPassword123!";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "ValidPassword123!";

				(component as unknown as { onSubmit(): void; }).onSubmit();

				expect(mockAuthService.setPassword)
					.toHaveBeenCalledWith(
						validToken,
						"ValidPassword123!");
				expect(mockNotificationService.success)
					.toHaveBeenCalledWith(
						"Password set successfully. You can now sign in.");
				expect(router.navigate)
					.toHaveBeenCalledWith(
						["/auth/login"]);
			});

		it("should show error for expired or invalid token",
			() =>
			{
				setupTestBed(
					{ token: validToken });
				const errorResponse: HttpErrorResponse =
					new HttpErrorResponse(
						{
							status: 404,
							statusText: "Not Found"
						});
				mockAuthService.setPassword.mockReturnValue(
					throwError(
						() => errorResponse));
				(component as unknown as { newPassword: string; }).newPassword = "ValidPassword123!";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "ValidPassword123!";

				(component as unknown as { onSubmit(): void; }).onSubmit();

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith(
					"An unexpected error occurred. Please try again.");
				expect((component as unknown as { isLoading(): boolean; }).isLoading())
					.toBe(false);
			});

		it("should show error for bad request",
			() =>
			{
				setupTestBed(
					{ token: validToken });
				const errorResponse: HttpErrorResponse =
					new HttpErrorResponse(
						{
							status: 400,
							statusText: "Bad Request",
							error: { detail: "Password does not meet requirements." }
						});
				mockAuthService.setPassword.mockReturnValue(
					throwError(
						() => errorResponse));
				(component as unknown as { newPassword: string; }).newPassword = "ValidPassword123!";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "ValidPassword123!";

				(component as unknown as { onSubmit(): void; }).onSubmit();

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith(
						"Password does not meet requirements.");
			});
	});
