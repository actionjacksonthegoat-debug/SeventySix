/**
 * TOTP setup component tests.
 * Verifies setup flow: initiation, QR code display, verification, and success state.
 */

import { Clipboard } from "@angular/cdk/clipboard";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { TotpService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { TotpSetupResponse } from "@shared/models";
import { NotificationService } from "@shared/services";
import { createMockNotificationService } from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { TotpSetupComponent } from "./totp-setup";

interface MockTotpService
{
	initiateSetup: ReturnType<typeof vi.fn>;
	confirmSetup: ReturnType<typeof vi.fn>;
}

interface MockClipboard
{
	copy: ReturnType<typeof vi.fn>;
}

const mockSetupResponse: TotpSetupResponse =
	{
		secret: "JBSWY3DPEHPK3PXP",
		qrCodeUri: "otpauth://totp/SeventySix:user@example.com?secret=JBSWY3DPEHPK3PXP"
	};

describe("TotpSetupComponent",
	() =>
	{
		let component: TotpSetupComponent;
		let fixture: ComponentFixture<TotpSetupComponent>;
		let mockTotpService: MockTotpService;
		let mockClipboard: MockClipboard;
		let mockNotificationService: ReturnType<typeof createMockNotificationService>;
		let router: Router;

		beforeEach(
			() =>
			{
				mockTotpService =
					{
						initiateSetup: vi
							.fn()
							.mockReturnValue(of(mockSetupResponse)),
						confirmSetup: vi
							.fn()
							.mockReturnValue(of(undefined))
					};
				mockClipboard =
					{
						copy: vi
							.fn()
							.mockReturnValue(true)
					};
				mockNotificationService =
					createMockNotificationService();

				TestBed
					.configureTestingModule(
						{
							imports: [TotpSetupComponent],
							providers: [
								provideZonelessChangeDetection(),
								{ provide: TotpService, useValue: mockTotpService },
								{ provide: Clipboard, useValue: mockClipboard },
								{
									provide: NotificationService,
									useValue: mockNotificationService
								}
							]
						});

				fixture =
					TestBed.createComponent(TotpSetupComponent);
				component =
					fixture.componentInstance;
				router =
					TestBed.inject(Router);

				vi.spyOn(router, "navigate");
			});

		it("should create",
			() =>
			{
				fixture.detectChanges();

				expect(component)
					.toBeTruthy();
			});

		it("should call initiateSetup on init",
			() =>
			{
				fixture.detectChanges();

				expect(mockTotpService.initiateSetup)
					.toHaveBeenCalled();
			});

		it("should set secret after successful initiation",
			() =>
			{
				fixture.detectChanges();

				expect(component["secret"]())
					.toBe("JBSWY3DPEHPK3PXP");
			});

		it("should move to scan step after initiation",
			() =>
			{
				fixture.detectChanges();

				expect(component["currentStep"]())
					.toBe(component["STEP_SCAN"]);
			});

		it("should show error on initiation failure",
			() =>
			{
				mockTotpService.initiateSetup.mockReturnValue(
					throwError(
						() => ({
							error: { message: "Setup failed" },
							status: 500
						})));

				fixture.detectChanges();

				expect(mockNotificationService.error)
					.toHaveBeenCalled();
			});

		it("should toggle manual entry view",
			() =>
			{
				fixture.detectChanges();

				component["onToggleManualEntry"]();

				expect(component["showManualEntry"]())
					.toBe(true);

				component["onToggleManualEntry"]();

				expect(component["showManualEntry"]())
					.toBe(false);
			});

		it("should proceed to verify step",
			() =>
			{
				fixture.detectChanges();

				component["onProceedToVerify"]();

				expect(component["currentStep"]())
					.toBe(component["STEP_VERIFY"]);
			});

		it("should go back to scan step",
			() =>
			{
				fixture.detectChanges();

				component["onProceedToVerify"]();
				component["onBackToScan"]();

				expect(component["currentStep"]())
					.toBe(component["STEP_SCAN"]);
			});

		it("should call confirmSetup with verification code",
			() =>
			{
				fixture.detectChanges();

				component["onProceedToVerify"]();
				component["verifyForm"].patchValue(
					{ verificationCode: "123456" });

				component["onConfirmSetup"]();

				expect(mockTotpService.confirmSetup)
					.toHaveBeenCalledWith(
						{ code: "123456" });
			});

		it("should move to success step after confirmation",
			() =>
			{
				fixture.detectChanges();

				component["onProceedToVerify"]();
				component["verifyForm"].patchValue(
					{ verificationCode: "123456" });

				component["onConfirmSetup"]();

				expect(component["currentStep"]())
					.toBe(component["STEP_SUCCESS"]);
			});

		it("should show error on confirmation failure",
			() =>
			{
				mockTotpService.confirmSetup.mockReturnValue(
					throwError(
						() => ({
							error: { message: "Invalid code" },
							status: 400
						})));

				fixture.detectChanges();

				component["onProceedToVerify"]();
				component["verifyForm"].patchValue(
					{ verificationCode: "123456" });

				component["onConfirmSetup"]();

				expect(mockNotificationService.error)
					.toHaveBeenCalled();
			});

		it("should not confirm with invalid form",
			() =>
			{
				fixture.detectChanges();

				component["onProceedToVerify"]();
				// Leave form empty

				component["onConfirmSetup"]();

				expect(mockTotpService.confirmSetup)
					.not
					.toHaveBeenCalled();
			});

		it("should navigate to backup codes setup",
			() =>
			{
				fixture.detectChanges();

				component["onSetupBackupCodes"]();

				expect(router.navigate)
					.toHaveBeenCalledWith(
						[APP_ROUTES.AUTH.BACKUP_CODES]);
			});

		it("should navigate home on finish",
			() =>
			{
				fixture.detectChanges();

				component["onFinish"]();

				expect(router.navigate)
					.toHaveBeenCalledWith(
						[APP_ROUTES.HOME]);
			});

		it("should navigate home on cancel",
			() =>
			{
				fixture.detectChanges();

				component["onCancel"]();

				expect(router.navigate)
					.toHaveBeenCalledWith(
						[APP_ROUTES.HOME]);
			});
	});