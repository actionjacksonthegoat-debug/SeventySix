/**
 * MFA verify component tests.
 * Verifies email/TOTP/backup code flows, resend cooldown, trust device toggle, and redirects.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { MFA_METHOD } from "@auth/constants";
import {
	AuthResponse,
	MfaState,
	VerifyMfaRequest
} from "@auth/models";
import { MfaService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { VerifyBackupCodeRequest, VerifyTotpRequest } from "@shared/models";
import { AuthService, NotificationService } from "@shared/services";
import { createMockNotificationService } from "@shared/testing";
import { of, throwError } from "rxjs";
import { vi } from "vitest";
import { MfaVerifyComponent } from "./mfa-verify";

interface MockMfaService
{
	getMfaState: ReturnType<typeof vi.fn>;
	verifyMfa: ReturnType<typeof vi.fn>;
	verifyTotp: ReturnType<typeof vi.fn>;
	verifyBackupCode: ReturnType<typeof vi.fn>;
	resendMfaCode: ReturnType<typeof vi.fn>;
	clearMfaState: ReturnType<typeof vi.fn>;
}

interface MockAuthService
{
	handleMfaSuccess: ReturnType<typeof vi.fn>;
}

const mockAuthResponse: AuthResponse =
	{
		accessToken: "test-token",
		expiresAt: "2025-01-01T00:00:00Z",
		email: "test@example.com",
		fullName: "Test User",
		requiresMfa: false,
		requiresPasswordChange: false,
		sessionInactivityMinutes: 0,
		sessionWarningSeconds: 0
	};

const mockMfaState: MfaState =
	{
		challengeToken: "challenge-token-123",
		email: "test@example.com",
		returnUrl: "/",
		mfaMethod: MFA_METHOD.email
	};

describe("MfaVerifyComponent",
	() =>
	{
		let component: MfaVerifyComponent;
		let fixture: ComponentFixture<MfaVerifyComponent>;
		let mockMfaService: MockMfaService;
		let mockAuthService: MockAuthService;
		let mockNotificationService: ReturnType<typeof createMockNotificationService>;
		let router: Router;

		function createComponent(mfaState: MfaState | null = mockMfaState): void
		{
			mockMfaService =
				{
					getMfaState: vi
						.fn()
						.mockReturnValue(mfaState),
					verifyMfa: vi
						.fn()
						.mockReturnValue(of(mockAuthResponse)),
					verifyTotp: vi
						.fn()
						.mockReturnValue(of(mockAuthResponse)),
					verifyBackupCode: vi
						.fn()
						.mockReturnValue(of(mockAuthResponse)),
					resendMfaCode: vi
						.fn()
						.mockReturnValue(of(undefined)),
					clearMfaState: vi.fn()
				};
			mockAuthService =
				{
					handleMfaSuccess: vi.fn()
				};
			mockNotificationService =
				createMockNotificationService();

			TestBed
				.configureTestingModule(
					{
						imports: [MfaVerifyComponent],
						providers: [
							provideZonelessChangeDetection(),
							{ provide: MfaService, useValue: mockMfaService },
							{ provide: AuthService, useValue: mockAuthService },
							{
								provide: NotificationService,
								useValue: mockNotificationService
							}
						]
					});

			fixture =
				TestBed.createComponent(MfaVerifyComponent);
			component =
				fixture.componentInstance;
			router =
				TestBed.inject(Router);

			vi.spyOn(router, "navigate");
			vi.spyOn(router, "navigateByUrl");

			fixture.detectChanges();
		}

		describe("initialization",
			() =>
			{
				it("should create",
					() =>
					{
						createComponent();
						expect(component)
							.toBeTruthy();
					});

				it("should redirect to login when no MFA state",
					() =>
					{
						createComponent(null);

						expect(router.navigate)
							.toHaveBeenCalledWith(
								[APP_ROUTES.AUTH.LOGIN]);
					});

				it("should set masked email from MFA state",
					() =>
					{
						createComponent();

						expect(component["maskedEmail"]())
							.toBe("t***t@example.com");
					});

				it("should default to email MFA mode",
					() =>
					{
						createComponent();

						expect(component["isEmailMode"]())
							.toBe(true);
					});

				it("should set TOTP mode when state has TOTP method",
					() =>
					{
						const totpState: MfaState =
							{
								...mockMfaState,
								mfaMethod: MFA_METHOD.totp
							};
						createComponent(totpState);

						expect(component["isTotpMode"]())
							.toBe(true);
					});
			});

		describe("email MFA verification",
			() =>
			{
				beforeEach(
					() => createComponent());

				it("should call verifyMfa with correct request",
					() =>
					{
						component["mfaForm"].patchValue(
							{ code: "123456" });

						component["onVerify"]();

						const expectedRequest: VerifyMfaRequest =
							{
								challengeToken: "challenge-token-123",
								code: "123456",
								trustDevice: false
							};
						expect(mockMfaService.verifyMfa)
							.toHaveBeenCalledWith(expectedRequest);
					});

				it("should handle successful verification",
					() =>
					{
						component["mfaForm"].patchValue(
							{ code: "123456" });

						component["onVerify"]();

						expect(mockAuthService.handleMfaSuccess)
							.toHaveBeenCalledWith(mockAuthResponse);
						expect(router.navigateByUrl)
							.toHaveBeenCalledWith("/");
					});

				it("should show error on verification failure",
					() =>
					{
						mockMfaService.verifyMfa.mockReturnValue(
							throwError(
								() => ({
									error: { detail: "Invalid code" },
									status: 400
								})));

						component["mfaForm"].patchValue(
							{ code: "000000" });

						component["onVerify"]();

						expect(mockNotificationService.error)
							.toHaveBeenCalled();
					});

				it("should not verify when code is empty",
					() =>
					{
						component["onVerify"]();

						expect(mockMfaService.verifyMfa)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("TOTP verification",
			() =>
			{
				beforeEach(
					() =>
					{
						const totpState: MfaState =
							{
								...mockMfaState,
								mfaMethod: MFA_METHOD.totp
							};
						createComponent(totpState);
					});

				it("should call verifyTotp with correct request",
					() =>
					{
						component["mfaForm"].patchValue(
							{ code: "654321" });

						component["onVerify"]();

						const expectedRequest: VerifyTotpRequest =
							{
								challengeToken: "challenge-token-123",
								code: "654321",
								trustDevice: false
							};
						expect(mockMfaService.verifyTotp)
							.toHaveBeenCalledWith(expectedRequest);
					});
			});

		describe("backup code verification",
			() =>
			{
				beforeEach(
					() => createComponent());

				it("should switch to backup code mode",
					() =>
					{
						component["onUseBackupCode"]();

						expect(component["showBackupCodeEntry"]())
							.toBe(true);
					});

				it("should call verifyBackupCode when in backup mode",
					() =>
					{
						component["onUseBackupCode"]();
						component["mfaForm"].patchValue(
							{ code: "ABCD1234" });

						component["onVerify"]();

						const expectedRequest: VerifyBackupCodeRequest =
							{
								challengeToken: "challenge-token-123",
								code: "ABCD1234",
								trustDevice: false
							};
						expect(mockMfaService.verifyBackupCode)
							.toHaveBeenCalledWith(expectedRequest);
					});

				it("should return to normal mode on cancel backup",
					() =>
					{
						component["onUseBackupCode"]();
						component["onCancelBackupCode"]();

						expect(component["showBackupCodeEntry"]())
							.toBe(false);
					});
			});

		describe("trust device",
			() =>
			{
				beforeEach(
					() => createComponent());

				it("should default to false",
					() =>
					{
						expect(component["trustDevice"]())
							.toBe(false);
					});

				it("should pass trustDevice flag in MFA request",
					() =>
					{
						component["trustDevice"].set(true);
						component["mfaForm"].patchValue(
							{ code: "123456" });

						component["onVerify"]();

						expect(mockMfaService.verifyMfa)
							.toHaveBeenCalledWith(
								expect.objectContaining(
									{ trustDevice: true }));
					});
			});

		describe("resend code",
			() =>
			{
				beforeEach(
					() => createComponent());

				it("should call resendMfaCode",
					() =>
					{
						component["onResendCode"]();

						expect(mockMfaService.resendMfaCode)
							.toHaveBeenCalledWith(
								{ challengeToken: "challenge-token-123" });
					});

				it("should show success notification after resend",
					() =>
					{
						component["onResendCode"]();

						expect(mockNotificationService.success)
							.toHaveBeenCalledWith(
								"A new code has been sent to your email.");
					});

				it("should start cooldown after resend",
					() =>
					{
						component["onResendCode"]();

						expect(component["resendOnCooldown"]())
							.toBe(true);
					});

				it("should not resend when on cooldown",
					() =>
					{
						component["resendOnCooldown"].set(true);

						component["onResendCode"]();

						expect(mockMfaService.resendMfaCode)
							.not
							.toHaveBeenCalled();
					});
			});

		describe("navigation",
			() =>
			{
				beforeEach(
					() => createComponent());

				it("should navigate to login on back",
					() =>
					{
						component["onBackToLogin"]();

						expect(mockMfaService.clearMfaState)
							.toHaveBeenCalled();
						expect(router.navigate)
							.toHaveBeenCalledWith(
								[APP_ROUTES.AUTH.LOGIN]);
					});
			});
	});