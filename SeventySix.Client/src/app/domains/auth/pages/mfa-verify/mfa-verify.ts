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
	DestroyRef,
	effect,
	EffectRef,
	inject,
	OnInit,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { Router } from "@angular/router";
import { MFA_CONFIG, MFA_METHOD } from "@auth/constants";
import {
	AuthResponse,
	MfaMethod,
	MfaState,
	VerifyMfaRequest
} from "@auth/models";
import { MfaService } from "@auth/services";
import {
	getBackupCodeErrorMessage,
	getMfaErrorMessage,
	requiresLoginRedirect
} from "@auth/utilities";
import { APP_ROUTES, AUTH_NOTIFICATION_MESSAGES } from "@shared/constants";
import { FORM_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { VerifyBackupCodeRequest, VerifyTotpRequest } from "@shared/models";
import { AuthService, NotificationService } from "@shared/services";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
import {
	interval,
	Subject
} from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component(
	{
		selector: "app-mfa-verify",
		standalone: true,
		imports: [ReactiveFormsModule, ...FORM_MATERIAL_MODULES, MatCheckboxModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./mfa-verify.html",
		styleUrl: "./mfa-verify.scss"
	})
/**
 * Component that handles MFA code verification after initial login.
 * Supports email-based MFA, TOTP, and backup code fallback.
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
	 * Form builder for creating reactive forms.
	 * @type {FormBuilder}
	 * @private
	 * @readonly
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * MFA verification form with code field.
	 * @type {FormGroup}
	 * @protected
	 * @readonly
	 */
	protected readonly mfaForm: FormGroup =
		this.formBuilder.group(
			{
				code: [
					"",
					[Validators.required]
				]
			});

	/**
	 * MFA state from login flow.
	 * @type {MfaState | null}
	 * @private
	 */
	private mfaState: MfaState | null = null;

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
		signal<MfaMethod>(MFA_METHOD.email);

	/**
	 * Whether showing backup code entry mode.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly showBackupCodeEntry: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Whether the user wants to trust this device for future logins.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly trustDevice: WritableSignal<boolean> =
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
				this.mfaMethod() === MFA_METHOD.email
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
				this.mfaMethod() === MFA_METHOD.totp
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
					? MFA_CONFIG.backupCodeLength
					: MFA_CONFIG.codeLength);

	/**
	 * Effect to update form validation when mode changes.
	 * @type {EffectRef}
	 * @private
	 * @readonly
	 */
	private readonly validationEffect: EffectRef =
		effect(
			() =>
			{
				const codeLength: number =
					this.expectedCodeLength();
				const pattern: RegExp =
					this.showBackupCodeEntry()
						? /^[A-Za-z0-9]+$/
						: /^\d+$/;

				this
					.mfaForm
					.get("code")
					?.setValidators(
						[
							Validators.required,
							Validators.minLength(codeLength),
							Validators.maxLength(codeLength),
							Validators.pattern(pattern)
						]);
				this
					.mfaForm
					.get("code")
					?.updateValueAndValidity();
			});

	/**
	 * Subject to stop the cooldown timer.
	 * @type {Subject<void>}
	 * @private
	 * @readonly
	 */
	private readonly stopCooldownSubject: Subject<void> =
		new Subject<void>();

	/**
	 * Angular destroy reference for automatic cleanup.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Initialize component: check MFA state, redirect if invalid.
	 */
	ngOnInit(): void
	{
		this.mfaState =
			this.mfaService.getMfaState();

		if (isNullOrUndefined(this.mfaState))
		{
			this.router.navigate(
				[APP_ROUTES.AUTH.LOGIN]);
			return;
		}

		this.maskedEmail.set(this.maskEmail(this.mfaState.email));

		// Set MFA method from state (default to email if not specified)
		if (
			this.mfaState.mfaMethod !== null
				&& this.mfaState.mfaMethod !== undefined)
		{
			this.mfaMethod.set(this.mfaState.mfaMethod);
		}
	}

	/**
	 * Checks if the verify button can be enabled.
	 * @returns {boolean}
	 * True when code is valid length and not loading.
	 */
	protected canVerify(): boolean
	{
		const code: string =
			this.mfaForm.value.code ?? "";
		return code.length === this.expectedCodeLength()
			&& !this.isLoading()
			&& !this.isResending();
	}

	/**
	 * Handles verification code submission.
	 * Routes to appropriate verification method based on current mode.
	 */
	protected onVerify(): void
	{
		if (isNullOrUndefined(this.mfaState) || !this.canVerify())
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
		if (isNullOrUndefined(this.mfaState))
		{
			return;
		}

		this.isLoading.set(true);

		const request: VerifyMfaRequest =
			{
				challengeToken: this.mfaState.challengeToken,
				code: this.mfaForm.value.code,
				trustDevice: this.trustDevice()
			};

		this
			.mfaService
			.verifyMfa(request)
			.pipe(
				takeUntilDestroyed(this.destroyRef))
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
		if (isNullOrUndefined(this.mfaState))
		{
			return;
		}

		this.isLoading.set(true);

		const request: VerifyTotpRequest =
			{
				challengeToken: this.mfaState.challengeToken,
				code: this.mfaForm.value.code,
				trustDevice: this.trustDevice()
			};

		this
			.mfaService
			.verifyTotp(request)
			.pipe(
				takeUntilDestroyed(this.destroyRef))
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
		if (isNullOrUndefined(this.mfaState))
		{
			return;
		}

		this.isLoading.set(true);

		const request: VerifyBackupCodeRequest =
			{
				challengeToken: this.mfaState.challengeToken,
				code: this.mfaForm.value.code,
				trustDevice: this.trustDevice()
			};

		this
			.mfaService
			.verifyBackupCode(request)
			.pipe(
				takeUntilDestroyed(this.destroyRef))
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
				AUTH_NOTIFICATION_MESSAGES.PASSWORD_CHANGE_REQUIRED);
			this.router.navigate(
				[APP_ROUTES.AUTH.CHANGE_PASSWORD],
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
		this.mfaForm.reset();

		const errorCode: string | undefined =
			error.error?.errorCode;

		const errorMessage: string =
			getMfaErrorMessage(
				errorCode,
				"Verification failed. Please try again.");

		this.notification.error(errorMessage);

		if (requiresLoginRedirect(errorCode))
		{
			this.mfaService.clearMfaState();
			this.router.navigate(
				[APP_ROUTES.AUTH.LOGIN]);
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
		this.mfaForm.reset();

		const errorCode: string | undefined =
			error.error?.errorCode;

		const errorMessage: string =
			getBackupCodeErrorMessage(
				errorCode,
				"Verification failed. Please try again.");

		this.notification.error(errorMessage);
	}

	/**
	 * Handles resend code button click.
	 */
	protected onResendCode(): void
	{
		if (isNullOrUndefined(this.mfaState) || this.resendOnCooldown() || this.isResending())
		{
			return;
		}

		this.isResending.set(true);

		this
			.mfaService
			.resendMfaCode(
				{ challengeToken: this.mfaState.challengeToken })
			.pipe(
				takeUntilDestroyed(this.destroyRef))
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
					"Failed to resend code. Please try again.");
		}
	}

	/**
	 * Starts the resend cooldown timer using RxJS interval.
	 * Timer automatically stops when cooldown reaches 0 or component is destroyed.
	 * @private
	 */
	private startCooldown(): void
	{
		this.resendOnCooldown.set(true);
		this.resendCooldownSeconds.set(MFA_CONFIG.resendCooldownSeconds);

		interval(1000)
			.pipe(
				takeUntil(this.stopCooldownSubject),
				takeUntilDestroyed(this.destroyRef))
			.subscribe(
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
				});
	}

	/**
	 * Stops the resend cooldown timer by emitting on the stop Subject.
	 * @private
	 */
	private stopCooldown(): void
	{
		this.stopCooldownSubject.next();
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
		this.mfaForm.reset();
	}

	/**
	 * Switches back from backup code entry to normal MFA mode.
	 */
	protected onCancelBackupCode(): void
	{
		this.showBackupCodeEntry.set(false);
		this.mfaForm.reset();
	}

	/**
	 * Masks an email for display (e.g., "test@example.com" → "t***t@example.com").
	 *
	 * @param {string} email
	 * The email address to mask.
	 *
	 * @returns {string}
	 * The masked email.
	 */
	private maskEmail(email: string): string
	{
		const atIndex: number =
			email.indexOf("@");

		if (atIndex <= 1)
		{
			return email;
		}

		return `${email[0]}***${email.slice(atIndex - 1)}`;
	}
}