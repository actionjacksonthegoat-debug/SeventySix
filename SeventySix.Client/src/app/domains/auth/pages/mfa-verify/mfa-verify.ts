/**
 * MFA verification page for email-based two-factor authentication.
 * Displays code entry and handles verification/resend flows.
 */

import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
	WritableSignal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";
import { AuthResponse, MfaState, VerifyMfaRequest } from "@auth/models";
import { MfaService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { AuthService, NotificationService } from "@shared/services";

/**
 * MFA code length.
 */
const MFA_CODE_LENGTH: number = 6;

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
 * Provides code entry and resend functionality.
 */
export class MfaVerifyComponent implements OnInit
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
	 * The 6-digit verification code entered by user.
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
	}

	/**
	 * Checks if the verify button can be enabled.
	 * @returns {boolean}
	 * True when code is valid length and not loading.
	 */
	protected canVerify(): boolean
	{
		return this.code.length === MFA_CODE_LENGTH
			&& !this.isLoading()
			&& !this.isResending();
	}

	/**
	 * Handles verification code submission.
	 */
	protected onVerify(): void
	{
		if (!this.mfaState || !this.canVerify())
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
			case "MFA_INVALID_CODE":
				this.notification.error("Invalid verification code. Please try again.");
				break;
			case "MFA_CODE_EXPIRED":
				this.notification.error("Code has expired. Please request a new code.");
				break;
			case "MFA_TOO_MANY_ATTEMPTS":
				this.notification.error(
					"Too many attempts. Please request a new code.");
				this.mfaService.clearMfaState();
				this.router.navigate(
					[APP_ROUTES.AUTH.LOGIN]);
				break;
			case "MFA_INVALID_CHALLENGE":
			case "MFA_CHALLENGE_USED":
				this.notification.error("Session expired. Please log in again.");
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
					next: () =>
						this.handleResendSuccess(),
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
}
