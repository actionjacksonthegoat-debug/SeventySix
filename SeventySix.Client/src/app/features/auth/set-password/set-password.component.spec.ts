/**
 * Set password component tests.
 * Verifies token-based password reset flow (80/20 - core paths only).
 */

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { SetPasswordComponent } from "./set-password.component";
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import { createMockNotificationService } from "@testing";

describe("SetPasswordComponent", () =>
{
	let component: SetPasswordComponent;
	let fixture: ComponentFixture<SetPasswordComponent>;
	let mockAuthService: jasmine.SpyObj<AuthService>;
	let mockNotificationService: jasmine.SpyObj<NotificationService>;
	let router: Router;

	const validToken: string = "valid-reset-token-12345";

	function setupTestBed(queryParams: Record<string, string> = {}): void
	{
		TestBed.configureTestingModule({
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

		fixture = TestBed.createComponent(SetPasswordComponent);
		component = fixture.componentInstance;
		router = TestBed.inject(Router);
		spyOn(router, "navigate");
		fixture.detectChanges();
	}

	beforeEach(() =>
	{
		mockAuthService = jasmine.createSpyObj("AuthService", ["setPassword"]);
		mockNotificationService = createMockNotificationService();
	});

	it("should create", () =>
	{
		setupTestBed({ token: validToken });
		expect(component).toBeTruthy();
	});

	it("should show error when token is missing", () =>
	{
		setupTestBed({});

		expect(mockNotificationService.error).toHaveBeenCalledWith(
			"Invalid password reset link. Please request a new one."
		);
		expect((component as any).tokenValid()).toBeFalse();
	});

	it("should show error when passwords do not match", () =>
	{
		setupTestBed({ token: validToken });
		(component as any).newPassword = "Password123!";
		(component as any).confirmPassword = "DifferentPassword123!";

		(component as any).onSubmit();

		expect(mockNotificationService.error).toHaveBeenCalledWith(
			"Passwords do not match."
		);
		expect(mockAuthService.setPassword).not.toHaveBeenCalled();
	});

	it("should navigate to login on successful password set", () =>
	{
		setupTestBed({ token: validToken });
		mockAuthService.setPassword.and.returnValue(of(undefined));
		(component as any).newPassword = "ValidPassword123!";
		(component as any).confirmPassword = "ValidPassword123!";

		(component as any).onSubmit();

		expect(mockAuthService.setPassword).toHaveBeenCalledWith(
			validToken,
			"ValidPassword123!"
		);
		expect(mockNotificationService.success).toHaveBeenCalledWith(
			"Password set successfully. You can now sign in."
		);
		expect(router.navigate).toHaveBeenCalledWith(["/auth/login"]);
	});

	it("should show error for expired or invalid token", () =>
	{
		setupTestBed({ token: validToken });
		const errorResponse: HttpErrorResponse = new HttpErrorResponse({
			status: 404,
			statusText: "Not Found"
		});
		mockAuthService.setPassword.and.returnValue(
			throwError(() => errorResponse)
		);
		(component as any).newPassword = "ValidPassword123!";
		(component as any).confirmPassword = "ValidPassword123!";

		(component as any).onSubmit();

		expect(mockNotificationService.error).toHaveBeenCalledWith(
			"Password reset link has expired or is invalid. Please request a new one."
		);
		expect((component as any).isLoading()).toBeFalse();
	});

	it("should show error for bad request", () =>
	{
		setupTestBed({ token: validToken });
		const errorResponse: HttpErrorResponse = new HttpErrorResponse({
			status: 400,
			statusText: "Bad Request",
			error: { detail: "Password does not meet requirements." }
		});
		mockAuthService.setPassword.and.returnValue(
			throwError(() => errorResponse)
		);
		(component as any).newPassword = "ValidPassword123!";
		(component as any).confirmPassword = "ValidPassword123!";

		(component as any).onSubmit();

		expect(mockNotificationService.error).toHaveBeenCalledWith(
			"Password does not meet requirements."
		);
	});
});
