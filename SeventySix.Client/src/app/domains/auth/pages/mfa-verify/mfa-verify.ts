/**
 * MFA verification page for email-based and TOTP two-factor authentication.
 * Displays code entry and handles verification/resend flows.
 * Supports fallback to backup codes for TOTP users.
 */

import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	OnDestroy,
	OnInit,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";
import { MFA_ERROR_CODE } from "@auth/constants";
import {
	AuthResponse,
	MfaMethod,
	MfaState,
	VerifyMfaRequest
} from "@auth/models";
import { MfaService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { VerifyBackupCodeRequest, VerifyTotpRequest } from "@shared/models";
import { AuthService, NotificationService } from "@shared/services";

/**
 * MFA method enum values.
 * Email = 0, Totp = 1
 */
const MFA_METHOD_EMAIL: number = 0;
const MFA_METHOD_TOTP: number = 1;

/**
 * MFA code length.
 */
const MFA_CODE_LENGTH: number = 6;

/**
 * Backup code length.
 */
const BACKUP_CODE_LENGTH: number = 8;

/**
 * Resend cooldown in seconds.
 */
const RESEND_COOLDOWN_SECONDS: number = 60;

@Component(
	{
		selector: "app-mfa-verify",
		standalone: true,
		imports: [FormsModule, MatButtonModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./mfa-verify.html",
		styleUrl: "./mfa-verify.scss"
	})
/**
 * Component that handles MFA code verification after initial login.
 * Supports email-based MFA, TOTP, and backup code fallback.
 */
export class MfaVerifyComponent implements OnInit, OnDestroy
{
	/**
	 * MFA service for verification operations.
	 * @type {MfaService}
	 * @private
	 * @readonly
	 */
	private readonly mfaService: MfaService =
		inject(MfaService);

	/**
	 * Auth service for token handling after successful MFA.
	 * @type {AuthService}
	 * @private
	 * @readonly
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Router for navigation.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Notification service for user messages.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notification: NotificationService =
		inject(NotificationService);

	/**
	 * MFA state from login flow.
	 * @type {MfaState | null}
	 * @private
	 */
	private mfaState: MfaState | null = null;

	/**
	 * The verification code entered by user.
	 * @type {string}
	 * @protected
	 */
	protected code: string = "";

	/**
	 * Loading state during verification.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Loading state during resend.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isResending: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Whether resend is on cooldown.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly resendOnCooldown: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Seconds remaining on resend cooldown.
	 * @type {WritableSignal<number>}
	 * @protected
	 * @readonly
	 */
	protected readonly resendCooldownSeconds: WritableSignal<number> =
		signal<number>(0);

	/**
	 * The masked email address displayed to user.
	 * @type {WritableSignal<string>}
	 * @protected
	 * @readonly
	 */
	protected readonly maskedEmail: WritableSignal<string> =
		signal<string>("");

	/**
	 * Current MFA method being used.
	 * @type {WritableSignal<MfaMethod>}
	 * @protected
	 * @readonly
	 */
	protected readonly mfaMethod: WritableSignal<MfaMethod> =
		signal<MfaMethod>(MFA_METHOD_EMAIL);

	/**
	 * Whether showing backup code entry mode.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly showBackupCodeEntry: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Computed: Whether current method is email-based MFA.
	 * @type {Signal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isEmailMode: Signal<boolean> =
		computed(
			() =>
				this.mfaMethod() === MFA_METHOD_EMAIL
					&& !this.showBackupCodeEntry());

	/**
	 * Computed: Whether current method is TOTP.
	 * @type {Signal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isTotpMode: Signal<boolean> =
		computed(
			() =>
				this.mfaMethod() === MFA_METHOD_TOTP
					&& !this.showBackupCodeEntry());

	/**
	 * Computed: Expected code length based on current mode.
	 * @type {Signal<number>}
	 * @protected
	 * @readonly
	 */
	protected readonly expectedCodeLength: Signal<number> =
		computed(
			() =>
				this.showBackupCodeEntry()
					? BACKUP_CODE_LENGTH
					: MFA_CODE_LENGTH);

	/**
	 * Cooldown timer interval.
	 * @type {number | null}
	 * @private
	 */
	private cooldownInterval: number | null = null;

	/**
	 * Initialize component: check MFA state, redirect if invalid.
	 */
	ngOnInit(): void
	{
		this.mfaState =
			this.mfaService.getMfaState();

		if (!this.mfaState)
		{
			this.router.navigate(
				[APP_ROUTES.AUTH.LOGIN]);
			return;
		}

		this.maskedEmail.set(this.mfaState.email);

		// Set MFA method from state (default to email if not specified)
		if (
			this.mfaState.mfaMethod !== null
				&& this.mfaState.mfaMethod !== undefined)
		{
			this.mfaMethod.set(this.mfaState.mfaMethod);
		}
	}

	/**
	 * Clean up interval on component destruction to prevent memory leaks.
	 */
	ngOnDestroy(): void
	{
		this.stopCooldown();
	}

	/**
	 * Checks if the verify button can be enabled.
	 * @returns {boolean}
	 * True when code is valid length and not loading.
	 */
	protected canVerify(): boolean
	{
		return this.code.length === this.expectedCodeLength()
			&& !this.isLoading()
			&& !this.isResending();
	}

	/**
	 * Handles verification code submission.
	 * Routes to appropriate verification method based on current mode.
	 */
	protected onVerify(): void
	{
		if (!this.mfaState || !this.canVerify())
		{
			return;
		}

		if (this.showBackupCodeEntry())
		{
			this.verifyBackupCode();
		}
		else if (this.isTotpMode())
		{
			this.verifyTotp();
		}
		else
		{
			this.verifyEmailMfa();
		}
	}

	/**
	 * Verifies email-based MFA code.
	 * @private
	 */
	private verifyEmailMfa(): void
	{
		if (!this.mfaState)
		{
			return;
		}

		this.isLoading.set(true);

		const request: VerifyMfaRequest =
			{
				challengeToken: this.mfaState.challengeToken,
				code: this.code
			};

		this
			.mfaService
			.verifyMfa(request)
			.subscribe(
				{
					next: (response: AuthResponse) =>
						this.handleVerifySuccess(response),
					error: (error: HttpErrorResponse) =>
						this.handleVerifyError(error)
				});
	}

	/**
	 * Verifies TOTP code.
	 * @private
	 */
	private verifyTotp(): void
	{
		if (!this.mfaState)
		{
			return;
		}

		this.isLoading.set(true);

		const request: VerifyTotpRequest =
			{
				email: this.mfaState.email,
				code: this.code
			};

		this
			.mfaService
			.verifyTotp(request)
			.subscribe(
				{
					next: (response: AuthResponse) =>
						this.handleVerifySuccess(response),
					error: (error: HttpErrorResponse) =>
						this.handleVerifyError(error)
				});
	}

	/**
	 * Verifies backup code.
	 * @private
	 */
	private verifyBackupCode(): void
	{
		if (!this.mfaState)
		{
			return;
		}

		this.isLoading.set(true);

		const request: VerifyBackupCodeRequest =
			{
				email: this.mfaState.email,
				code: this.code
			};

		this
			.mfaService
			.verifyBackupCode(request)
			.subscribe(
				{
					next: (response: AuthResponse) =>
						this.handleVerifySuccess(response),
					error: (error: HttpErrorResponse) =>
						this.handleBackupCodeError(error)
				});
	}

	/**
	 * Handles successful MFA verification.
	 * @param {AuthResponse} response
	 * The authentication response.
	 * @private
	 */
	private handleVerifySuccess(response: AuthResponse): void
	{
		// Set tokens in AuthService
		this.authService.handleMfaSuccess(response);

		const returnUrl: string =
			this.mfaState?.returnUrl ?? "/";

		if (response.requiresPasswordChange)
		{
			this.notification.info(
				"You must change your password before continuing.");
			this.router.navigate(
				["/auth/change-password"],
				{
					queryParams: {
						required: "true",
						returnUrl
					}
				});
		}
		else
		{
			this.router.navigateByUrl(returnUrl);
		}
	}

	/**
	 * Handles MFA verification error.
	 * @param {HttpErrorResponse} error
	 * The HTTP error response.
	 * @private
	 */
	private handleVerifyError(error: HttpErrorResponse): void
	{
		this.isLoading.set(false);
		this.code = "";

		const errorCode: string | undefined =
			error.error?.errorCode;

		switch (errorCode)
		{
			case MFA_ERROR_CODE.INVALID_CODE:
			case MFA_ERROR_CODE.TOTP_INVALID_CODE:
				this.notification.error("Invalid verification code. Please try again.");
				break;
			case MFA_ERROR_CODE.CODE_EXPIRED:
				this.notification.error("Code has expired. Please request a new code.");
				break;
			case MFA_ERROR_CODE.TOO_MANY_ATTEMPTS:
			case MFA_ERROR_CODE.TOTP_TOO_MANY_ATTEMPTS:
				this.notification.error(
					"Too many attempts. Please request a new code.");
				this.mfaService.clearMfaState();
				this.router.navigate(
					[APP_ROUTES.AUTH.LOGIN]);
				break;
			case MFA_ERROR_CODE.INVALID_CHALLENGE:
			case MFA_ERROR_CODE.CHALLENGE_USED:
				this.notification.error("Session expired. Please log in again.");
				this.mfaService.clearMfaState();
				this.router.navigate(
					[APP_ROUTES.AUTH.LOGIN]);
				break;
			case MFA_ERROR_CODE.TOTP_NOT_ENABLED:
				this.notification.error("Authenticator app is not set up. Please log in again.");
				this.mfaService.clearMfaState();
				this.router.navigate(
					[APP_ROUTES.AUTH.LOGIN]);
				break;
			default:
				this.notification.error(
					error.error?.detail ?? "Verification failed. Please try again.");
		}
	}

	/**
	 * Handles backup code verification error.
	 * @param {HttpErrorResponse} error
	 * The HTTP error response.
	 * @private
	 */
	private handleBackupCodeError(error: HttpErrorResponse): void
	{
		this.isLoading.set(false);
		this.code = "";

		const errorCode: string | undefined =
			error.error?.errorCode;

		switch (errorCode)
		{
			case MFA_ERROR_CODE.BACKUP_CODE_INVALID:
				this.notification.error("Invalid backup code. Please try again.");
				break;
			case MFA_ERROR_CODE.BACKUP_CODE_ALREADY_USED:
				this.notification.error("This backup code has already been used.");
				break;
			case MFA_ERROR_CODE.NO_BACKUP_CODES_AVAILABLE:
				this.notification.error(
					"No backup codes available. Please contact support.");
				break;
			default:
				this.notification.error(
					error.error?.detail ?? "Verification failed. Please try again.");
		}
	}

	/**
	 * Handles resend code button click.
	 */
	protected onResendCode(): void
	{
		if (!this.mfaState || this.resendOnCooldown() || this.isResending())
		{
			return;
		}

		this.isResending.set(true);

		this
			.mfaService
			.resendMfaCode(
				{ challengeToken: this.mfaState.challengeToken })
			.subscribe(
				{
					next: () => this.handleResendSuccess(),
					error: (error: HttpErrorResponse) =>
						this.handleResendError(error)
				});
	}

	/**
	 * Handles successful code resend.
	 * @private
	 */
	private handleResendSuccess(): void
	{
		this.isResending.set(false);
		this.notification.success("A new code has been sent to your email.");
		this.startCooldown();
	}

	/**
	 * Handles code resend error.
	 * @param {HttpErrorResponse} error
	 * The HTTP error response.
	 * @private
	 */
	private handleResendError(error: HttpErrorResponse): void
	{
		this.isResending.set(false);

		const errorCode: string | undefined =
			error.error?.errorCode;

		switch (errorCode)
		{
			case "MFA_RESEND_COOLDOWN":
				this.notification.warning("Please wait before requesting another code.");
				this.startCooldown();
				break;
			case "MFA_INVALID_CHALLENGE":
				this.notification.error("Session expired. Please log in again.");
				this.mfaService.clearMfaState();
				this.router.navigate(
					[APP_ROUTES.AUTH.LOGIN]);
				break;
			default:
				this.notification.error(
					error.error?.detail ?? "Failed to resend code. Please try again.");
		}
	}

	/**
	 * Starts the resend cooldown timer.
	 * @private
	 */
	private startCooldown(): void
	{
		this.resendOnCooldown.set(true);
		this.resendCooldownSeconds.set(RESEND_COOLDOWN_SECONDS);

		this.cooldownInterval =
			window.setInterval(
				() =>
				{
					const remaining: number =
						this.resendCooldownSeconds() - 1;

					if (remaining <= 0)
					{
						this.stopCooldown();
					}
					else
					{
						this.resendCooldownSeconds.set(remaining);
					}
				},
				1000);
	}

	/**
	 * Stops the resend cooldown timer.
	 * @private
	 */
	private stopCooldown(): void
	{
		if (this.cooldownInterval !== null)
		{
			clearInterval(this.cooldownInterval);
			this.cooldownInterval = null;
		}

		this.resendOnCooldown.set(false);
		this.resendCooldownSeconds.set(0);
	}

	/**
	 * Navigates back to login.
	 */
	protected onBackToLogin(): void
	{
		this.mfaService.clearMfaState();
		this.router.navigate(
			[APP_ROUTES.AUTH.LOGIN]);
	}

	/**
	 * Switches to backup code entry mode.
	 */
	protected onUseBackupCode(): void
	{
		this.showBackupCodeEntry.set(true);
		this.code = "";
	}

	/**
	 * Switches back from backup code entry to normal MFA mode.
	 */
	protected onCancelBackupCode(): void
	{
		this.showBackupCodeEntry.set(false);
		this.code = "";
	}
}
