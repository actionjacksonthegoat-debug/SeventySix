import { HttpErrorResponse } from "@angular/common/http";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { ActivatedRoute } from "@angular/router";
import { AltchaService } from "@shared/services";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import {
	createMockAltchaService,
	createMockNotificationService,
	MockAltchaService
} from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { RegisterCompleteComponent } from "./register-complete";

interface MockAuthService
{
	completeRegistration: ReturnType<typeof vi.fn>;
}

describe("RegisterCompleteComponent",
	() =>
	{
		let component: RegisterCompleteComponent;
		let fixture: ComponentFixture<RegisterCompleteComponent>;
		let mockAuthService: MockAuthService;
		let mockNotificationService: ReturnType<typeof createMockNotificationService>;
		let mockAltchaService: MockAltchaService;
		let router: Router;

		function setupTestBed(queryParams: Record<string, string> = {})
		{
			TestBed.configureTestingModule(
				{
					imports: [RegisterCompleteComponent],
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
						},
						{ provide: ActivatedRoute, useValue: { snapshot: { queryParams } } }
					]
				});

			fixture =
				TestBed.createComponent(RegisterCompleteComponent);
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
					{ completeRegistration: vi.fn() };
				mockNotificationService =
					createMockNotificationService();
				mockAltchaService =
					createMockAltchaService(false);
			});

		it("should create",
			() =>
			{
				setupTestBed(
					{ token: "valid-token" });
				expect(component)
					.toBeTruthy();
			});

		it("should show error when token missing",
			() =>
			{
				setupTestBed({});

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith(
						"Invalid registration link. Please request a new one.");
				expect((component as unknown as { tokenValid(): boolean; }).tokenValid())
					.toBe(false);
			});

		it("should show validation errors and not call service",
			() =>
			{
				setupTestBed(
					{ token: "valid-token" });

				(component as unknown as { username: string; }).username = "ab"; // too short
				(component as unknown as { password: string; }).password = "short";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "short";

				(component as unknown as { onSubmit(): void; }).onSubmit();

				expect(mockNotificationService.error)
					.toHaveBeenCalled();
				expect(mockAuthService.completeRegistration).not.toHaveBeenCalled();
			});

		it("should navigate to root on successful registration",
			async () =>
			{
				setupTestBed(
					{ token: "valid-token" });
				mockAuthService.completeRegistration.mockReturnValue(of(undefined));

				(component as unknown as { username: string; }).username = "valid_user";
				(component as unknown as { password: string; }).password = "ValidPassword123!";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "ValidPassword123!";

				(component as unknown as { onSubmit(): void; }).onSubmit();
				await fixture.whenStable();

				expect(mockAuthService.completeRegistration)
					.toHaveBeenCalledWith(
						"valid-token",
						"valid_user",
						"ValidPassword123!",
						null);
				expect(mockNotificationService.success)
					.toHaveBeenCalledWith("Account created successfully!");
				expect(router.navigate)
					.toHaveBeenCalledWith(
						["/"]);
			});

		it("should show error message from API on failure",
			async () =>
			{
				setupTestBed(
					{ token: "valid-token" });
				const errorResponse: HttpErrorResponse =
					new HttpErrorResponse(
						{ status: 400, statusText: "Bad Request", error: { detail: "Username already exists." } });
				mockAuthService.completeRegistration.mockReturnValue(throwError(() => errorResponse));

				(component as unknown as { username: string; }).username = "valid_user";
				(component as unknown as { password: string; }).password = "ValidPassword123!";
				(component as unknown as { confirmPassword: string; }).confirmPassword = "ValidPassword123!";

				(component as unknown as { onSubmit(): void; }).onSubmit();
				await fixture.whenStable();

				expect(mockNotificationService.error)
					.toHaveBeenCalledWith("Username already exists.");
			});
	});
