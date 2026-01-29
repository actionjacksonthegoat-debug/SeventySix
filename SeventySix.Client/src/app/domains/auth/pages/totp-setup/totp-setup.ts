/**
 * TOTP setup page for authenticator app enrollment.
 * Displays QR code, manual entry option, and verification code input.
 */

import { Clipboard } from "@angular/cdk/clipboard";
import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
	WritableSignal
} from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { CLIPBOARD_RESET_DELAY_MS, QR_CODE_CONFIG } from "@auth/constants";
import { TotpService } from "@auth/services";
import { APP_ROUTES } from "@shared/constants";
import { TotpSetupResponse } from "@shared/models";
import { NotificationService } from "@shared/services";
import { copyWithFeedback } from "@shared/utilities";
import * as QRCode from "qrcode";

/**
 * TOTP verification code length.
 */
const TOTP_CODE_LENGTH: number = 6;

/**
 * Setup step identifiers.
 */
const SETUP_STEP_LOADING: number = 0;
const SETUP_STEP_SCAN: number = 1;
const SETUP_STEP_VERIFY: number = 2;
const SETUP_STEP_SUCCESS: number = 3;

@Component(
	{
		selector: "app-totp-setup",
		standalone: true,
		imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./totp-setup.html",
		styleUrl: "./totp-setup.scss"
	})
/**
 * Component for setting up TOTP (authenticator app) two-factor authentication.
 * Guides users through QR code scanning and verification.
 */
export class TotpSetupComponent implements OnInit
{
	/**
	 * TOTP service for enrollment operations.
	 * @type {TotpService}
	 * @private
	 * @readonly
	 */
	private readonly totpService: TotpService =
		inject(TotpService);

	/**
	 * Router for navigation after setup.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Notification service for user feedback.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notification: NotificationService =
		inject(NotificationService);

	/**
	 * Clipboard service for copy operations.
	 * @type {Clipboard}
	 * @private
	 * @readonly
	 */
	private readonly clipboard: Clipboard =
		inject(Clipboard);

	/**
	 * Form builder for creating reactive forms.
	 * @type {FormBuilder}
	 * @private
	 * @readonly
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Verification form with code field.
	 * @type {FormGroup}
	 * @protected
	 * @readonly
	 */
	protected readonly verifyForm: FormGroup =
		this.formBuilder.group(
			{
				verificationCode: [
					"",
					[
						Validators.required,
						Validators.pattern(/^\d{6}$/)
					]
				]
			});

	/**
	 * Current setup step.
	 * 0 = loading, 1 = scan, 2 = verify, 3 = success
	 * @type {WritableSignal<number>}
	 * @protected
	 * @readonly
	 */
	protected readonly currentStep: WritableSignal<number> =
		signal<number>(SETUP_STEP_LOADING);

	/**
	 * Whether an API request is in progress.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * TOTP secret key for manual entry.
	 * @type {WritableSignal<string>}
	 * @protected
	 * @readonly
	 */
	protected readonly secret: WritableSignal<string> =
		signal<string>("");

	/**
	 * QR code data URL for display.
	 * @type {WritableSignal<string>}
	 * @protected
	 * @readonly
	 */
	protected readonly qrCodeDataUrl: WritableSignal<string> =
		signal<string>("");

	/**
	 * Whether to show manual entry instead of QR code.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly showManualEntry: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Whether the secret has been copied to clipboard.
	 * @type {WritableSignal<boolean>}
	 * @protected
	 * @readonly
	 */
	protected readonly secretCopied: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Error message from API.
	 * @type {WritableSignal<string>}
	 * @protected
	 * @readonly
	 */
	protected readonly errorMessage: WritableSignal<string> =
		signal<string>("");

	/**
	 * Step constants for template use.
	 */
	protected readonly STEP_LOADING: number = SETUP_STEP_LOADING;
	protected readonly STEP_SCAN: number = SETUP_STEP_SCAN;
	protected readonly STEP_VERIFY: number = SETUP_STEP_VERIFY;
	protected readonly STEP_SUCCESS: number = SETUP_STEP_SUCCESS;
	protected readonly CODE_LENGTH: number = TOTP_CODE_LENGTH;

	/**
	 * Initializes the component by fetching TOTP setup data.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		this.initiateSetup();
	}

	/**
	 * Initiates TOTP enrollment by fetching setup data from API.
	 * @returns {void}
	 * @private
	 */
	private initiateSetup(): void
	{
		this.isLoading.set(true);
		this.errorMessage.set("");

		this
			.totpService
			.initiateSetup()
			.subscribe(
				{
					next: (response: TotpSetupResponse) =>
					{
						this.secret.set(response.secret);
						this.generateQrCode(response.qrCodeUri);
						this.currentStep.set(SETUP_STEP_SCAN);
						this.isLoading.set(false);
					},
					error: (error: HttpErrorResponse) =>
					{
						this.handleError(error, "Failed to initialize TOTP setup");
						this.isLoading.set(false);
					}
				});
	}

	/**
	 * Generates a QR code image from the TOTP URI.
	 * @param {string} uri
	 * The otpauth:// URI to encode.
	 * @returns {void}
	 * @private
	 */
	private generateQrCode(uri: string): void
	{
		QRCode
			.toDataURL(
				uri,
				{
					width: QR_CODE_CONFIG.width,
					margin: QR_CODE_CONFIG.margin,
					color: {
						dark: QR_CODE_CONFIG.colors.dark,
						light: QR_CODE_CONFIG.colors.light
					}
				})
			.then(
				(dataUrl: string) =>
				{
					this.qrCodeDataUrl.set(dataUrl);
				})
			.catch(
				(error: Error) =>
				{
					console.error("Failed to generate QR code:", error);
					this.showManualEntry.set(true);
				});
	}

	/**
	 * Handles API errors by extracting message and showing notification.
	 * @param {HttpErrorResponse} error
	 * The HTTP error response.
	 * @param {string} fallbackMessage
	 * Default message if none in response.
	 * @returns {void}
	 * @private
	 */
	private handleError(
		error: HttpErrorResponse,
		fallbackMessage: string): void
	{
		const message: string =
			error.error?.message
				?? error.error?.title
				?? fallbackMessage;
		this.errorMessage.set(message);
		this.notification.error(message);
	}

	/**
	 * Toggles between QR code and manual entry views.
	 * @returns {void}
	 * @protected
	 */
	protected onToggleManualEntry(): void
	{
		this.showManualEntry.update(
			(current: boolean) => !current);
	}

	/**
	 * Copies the TOTP secret to clipboard.
	 * @returns {void}
	 * @protected
	 */
	protected onCopySecret(): void
	{
		const success: boolean =
			copyWithFeedback(
				this.clipboard,
				this.secret(),
				this.secretCopied,
				CLIPBOARD_RESET_DELAY_MS);

		if (success)
		{
			this.notification.success("Secret copied to clipboard");
		}
		else
		{
			this.notification.error("Failed to copy to clipboard");
		}
	}

	/**
	 * Proceeds to verification step.
	 * @returns {void}
	 * @protected
	 */
	protected onProceedToVerify(): void
	{
		this.currentStep.set(SETUP_STEP_VERIFY);
		this.errorMessage.set("");
	}

	/**
	 * Returns to scan step from verification.
	 * @returns {void}
	 * @protected
	 */
	protected onBackToScan(): void
	{
		this.currentStep.set(SETUP_STEP_SCAN);
		this.verifyForm.reset();
		this.errorMessage.set("");
	}

	/**
	 * Confirms TOTP enrollment by verifying the code.
	 * @returns {void}
	 * @protected
	 */
	protected onConfirmSetup(): void
	{
		if (this.verifyForm.invalid)
		{
			this.verifyForm.markAllAsTouched();
			this.errorMessage.set(`Please enter a ${TOTP_CODE_LENGTH}-digit code`);
			return;
		}

		this.isLoading.set(true);
		this.errorMessage.set("");

		const verificationCode: string =
			this.verifyForm.value.verificationCode;

		this
			.totpService
			.confirmSetup(
				{ code: verificationCode })
			.subscribe(
				{
					next: () =>
					{
						this.currentStep.set(SETUP_STEP_SUCCESS);
						this.isLoading.set(false);
						this.notification.success(
							"Authenticator app enabled successfully");
					},
					error: (error: HttpErrorResponse) =>
					{
						this.handleError(error, "Invalid verification code");
						this.isLoading.set(false);
					}
				});
	}

	/**
	 * Navigates to backup codes setup.
	 * @returns {void}
	 * @protected
	 */
	protected onSetupBackupCodes(): void
	{
		this.router.navigate(
			[APP_ROUTES.AUTH.BACKUP_CODES]);
	}

	/**
	 * Navigates back to security settings or dashboard.
	 * @returns {void}
	 * @protected
	 */
	protected onFinish(): void
	{
		this.router.navigate(
			[APP_ROUTES.HOME]);
	}

	/**
	 * Cancels TOTP setup and navigates back.
	 * @returns {void}
	 * @protected
	 */
	protected onCancel(): void
	{
		this.router.navigate(
			[APP_ROUTES.HOME]);
	}

	/**
	 * Checks if verification code is valid (6 digits).
	 * @returns {boolean}
	 * True if code is valid.
	 * @protected
	 */
	protected isCodeValid(): boolean
	{
		return this.verifyForm.valid;
	}
}
