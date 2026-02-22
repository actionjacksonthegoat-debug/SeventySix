/**
 * Backup codes component tests.
 * Verifies code generation, display, copy/download actions, and step flow.
 */

import { Clipboard } from "@angular/cdk/clipboard";
import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { BackupCodesService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { DateService, NotificationService } from "@shared/services";
import { createMockNotificationService } from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { BackupCodesComponent } from "./backup-codes";

interface MockBackupCodesService
{
	generate: ReturnType<typeof vi.fn>;
}

interface MockClipboard
{
	copy: ReturnType<typeof vi.fn>;
}

interface MockDateService
{
	nowDate: ReturnType<typeof vi.fn>;
	formatLocal: ReturnType<typeof vi.fn>;
}

const mockCodes: string[] =
	[
		"AAAA1111",
		"BBBB2222",
		"CCCC3333",
		"DDDD4444",
		"EEEE5555",
		"FFFF6666",
		"GGGG7777",
		"HHHH8888",
		"IIII9999",
		"JJJJ0000"
	];

describe("BackupCodesComponent",
	() =>
	{
		let component: BackupCodesComponent;
		let fixture: ComponentFixture<BackupCodesComponent>;
		let mockBackupCodesService: MockBackupCodesService;
		let mockClipboard: MockClipboard;
		let mockDateService: MockDateService;
		let mockNotificationService: ReturnType<typeof createMockNotificationService>;
		let router: Router;

		beforeEach(
			() =>
			{
				mockBackupCodesService =
					{
						generate: vi
							.fn()
							.mockReturnValue(of(mockCodes))
					};
				mockClipboard =
					{
						copy: vi
							.fn()
							.mockReturnValue(true)
					};
				mockDateService =
					{
						nowDate: vi
							.fn()
							.mockReturnValue("2025-01-15T00:00:00Z"),
						formatLocal: vi
							.fn()
							.mockReturnValue("Jan 15, 2025")
					};
				mockNotificationService =
					createMockNotificationService();

				TestBed
					.configureTestingModule(
						{
							imports: [BackupCodesComponent],
							providers: [
								provideZonelessChangeDetection(),
								{
									provide: BackupCodesService,
									useValue: mockBackupCodesService
								},
								{ provide: Clipboard, useValue: mockClipboard },
								{ provide: DateService, useValue: mockDateService },
								{
									provide: NotificationService,
									useValue: mockNotificationService
								}
							]
						});

				fixture =
					TestBed.createComponent(BackupCodesComponent);
				component =
					fixture.componentInstance;
				router =
					TestBed.inject(Router);

				vi.spyOn(router, "navigate");

				fixture.detectChanges();
			});

		it("should create",
			() =>
			{
				expect(component)
					.toBeTruthy();
			});

		it("should start at warning step",
			() =>
			{
				expect(component["currentStep"]())
					.toBe(component["STEP_WARNING"]);
			});

		it("should not auto-generate codes on init",
			() =>
			{
				expect(mockBackupCodesService.generate)
					.not
					.toHaveBeenCalled();
			});

		describe("code generation",
			() =>
			{
				it("should generate codes when user confirms",
					() =>
					{
						component["onGenerateCodes"]();

						expect(mockBackupCodesService.generate)
							.toHaveBeenCalled();
					});

				it("should display codes after generation",
					() =>
					{
						component["onGenerateCodes"]();

						expect(component["codes"]())
							.toEqual(mockCodes);
					});

				it("should move to codes step after generation",
					() =>
					{
						component["onGenerateCodes"]();

						expect(component["currentStep"]())
							.toBe(component["STEP_CODES"]);
					});

				it("should show error on generation failure",
					() =>
					{
						mockBackupCodesService.generate.mockReturnValue(
							throwError(
								() => ({
									error: { message: "Failed to generate" },
									status: 500
								})));

						component["onGenerateCodes"]();

						expect(mockNotificationService.error)
							.toHaveBeenCalled();
					});

				it("should return to warning step on failure",
					() =>
					{
						mockBackupCodesService.generate.mockReturnValue(
							throwError(
								() => ({
									error: {},
									status: 500
								})));

						component["onGenerateCodes"]();

						expect(component["currentStep"]())
							.toBe(component["STEP_WARNING"]);
					});
			});

		describe("code actions",
			() =>
			{
				beforeEach(
					() =>
					{
						component["onGenerateCodes"]();
					});

				it("should copy codes to clipboard",
					() =>
					{
						component["onCopyCodes"]();

						expect(mockClipboard.copy)
							.toHaveBeenCalled();
						expect(mockNotificationService.success)
							.toHaveBeenCalledWith(
								"Backup codes copied to clipboard");
					});

				it("should set codesCopied flag after copy",
					() =>
					{
						component["onCopyCodes"]();

						expect(component["codesCopied"]())
							.toBe(true);
					});

				it("should show error when copy fails",
					() =>
					{
						mockClipboard.copy.mockReturnValue(false);

						component["onCopyCodes"]();

						expect(mockNotificationService.error)
							.toHaveBeenCalledWith(
								"Failed to copy to clipboard");
					});
			});

		describe("step flow",
			() =>
			{
				it("should proceed to confirm step on acknowledge",
					() =>
					{
						component["onGenerateCodes"]();
						component["onAcknowledgeSaved"]();

						expect(component["currentStep"]())
							.toBe(component["STEP_CONFIRM"]);
						expect(component["hasSavedCodes"]())
							.toBe(true);
					});
			});

		describe("navigation",
			() =>
			{
				it("should navigate home on finish",
					() =>
					{
						component["onFinish"]();

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[APP_ROUTES.HOME]);
					});

				it("should navigate home on cancel",
					() =>
					{
						component["onCancel"]();

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[APP_ROUTES.HOME]);
					});
			});
	});