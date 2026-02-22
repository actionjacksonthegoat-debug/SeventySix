/**
 * Forgot password page for initiating email-based password reset.
 * Always shows confirmation message regardless of whether email exists (security).
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
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
import { RouterLink } from "@angular/router";
import { AltchaWidgetComponent } from "@shared/components";
import { FORM_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { AltchaService, AuthService, NotificationService } from "@shared/services";
import { getValidationError } from "@shared/utilities";

@Component(
	{
		selector: "app-forgot-password",
		standalone: true,
		imports: [
			ReactiveFormsModule,
			RouterLink,
			...FORM_MATERIAL_MODULES,
			AltchaWidgetComponent
		],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./forgot-password.html",
		styleUrl: "./forgot-password.scss"
	})
/**
 * Initiates email-based password reset and always shows a confirmation message
 * to avoid disclosing whether an email address exists.
 */
export class ForgotPasswordComponent
{
	private readonly authService: AuthService =
		inject(AuthService);
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);
	private readonly notification: NotificationService =
		inject(NotificationService);
	private readonly altchaService: AltchaService =
		inject(AltchaService);
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Whether ALTCHA validation is enabled.
	 * @type {boolean}
	 */
	protected readonly altchaEnabled: boolean =
		this.altchaService.enabled;

	/**
	 * ALTCHA challenge endpoint URL.
	 * @type {string}
	 */
	protected readonly challengeUrl: string =
		this.altchaService.challengeEndpoint;

	/**
	 * Forgot password form with email field.
	 * @type {FormGroup}
	 */
	protected readonly forgotPasswordForm: FormGroup =
		this.formBuilder.group(
			{
				email: [
					"",
					[
						Validators.required,
						Validators.email
					]
				]
			});

	/**
	 * Validation error message for email field.
	 * @type {Signal<string | null>}
	 */
	protected readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.forgotPasswordForm.get("email"),
					"Email"));

	/**
	 * Loading state while the password reset request is in-flight.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Whether the reset request has been submitted (controls confirmation UI).
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly submitted: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * ALTCHA verification payload from the widget.
	 * @type {WritableSignal<string | null>}
	 * @private
	 */
	private readonly altchaPayload: WritableSignal<string | null> =
		signal<string | null>(null);

	/**
	 * Handles ALTCHA verification completion.
	 * @param {string} payload
	 * The ALTCHA verification payload.
	 */
	protected onAltchaVerified(payload: string): void
	{
		this.altchaPayload.set(payload);
	}

	/**
	 * Checks if form can be submitted.
	 * @returns {boolean}
	 * True when all required fields are valid.
	 */
	protected canSubmit(): boolean
	{
		const formValid: boolean =
			this.forgotPasswordForm.valid;
		const hasAltcha: boolean =
			!this.altchaEnabled || this.altchaPayload() !== null;
		return formValid && hasAltcha && !this.isLoading();
	}

	/**
	 * Submits the forgot password request. Shows a confirmation message regardless
	 * of outcome to avoid disclosing whether the email exists.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (this.forgotPasswordForm.invalid)
		{
			this.forgotPasswordForm.markAllAsTouched();
			return;
		}

		if (this.altchaEnabled && !this.altchaPayload())
		{
			this.notification.error("Please complete the verification challenge.");
			return;
		}

		this.isLoading.set(true);

		const email: string =
			this.forgotPasswordForm.value.email;

		this
			.authService
			.requestPasswordReset(
				email,
				this.altchaPayload())
			.pipe(
				takeUntilDestroyed(this.destroyRef))
			.subscribe(
				{
					next: () =>
					{
						this.submitted.set(true);
						this.isLoading.set(false);
						this.notification.success(
							"If an account exists with this email, a reset link has been sent.");
					},
					error: () =>
					{
						this.isLoading.set(false);
						this.notification.error(
							"Unable to process request. Please try again later.");
					}
				});
	}
}