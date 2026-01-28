/**
 * Forgot password page for initiating email-based password reset.
 * Always shows confirmation message regardless of whether email exists (security).
 */

import {
	ChangeDetectionStrategy,
	Component,
	inject,
	signal,
	WritableSignal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { validateEmail } from "@auth/utilities";
import { AltchaWidgetComponent } from "@shared/components";
import { AltchaService, AuthService, NotificationService } from "@shared/services";

@Component(
	{
		selector: "app-forgot-password",
		standalone: true,
		imports: [
			FormsModule,
			RouterLink,
			MatButtonModule,
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
	private readonly notification: NotificationService =
		inject(NotificationService);
	private readonly altchaService: AltchaService =
		inject(AltchaService);

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
	 * Email address entered by the user to request a password reset.
	 * @type {string}
	 */
	protected email: string = "";

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
	 * @type {string | null}
	 * @private
	 */
	private altchaPayload: string | null = null;

	/**
	 * Validates email format using shared validation utility.
	 *
	 * @returns {boolean}
	 * True when `email` is a valid-looking address.
	 */
	protected isValidEmail(): boolean
	{
		return validateEmail(this.email).valid;
	}

	/**
	 * Handles ALTCHA verification completion.
	 * @param {string} payload
	 * The ALTCHA verification payload.
	 */
	protected onAltchaVerified(payload: string): void
	{
		this.altchaPayload = payload;
	}

	/**
	 * Checks if form can be submitted.
	 * @returns {boolean}
	 * True when all required fields are valid.
	 */
	protected canSubmit(): boolean
	{
		const hasEmail: boolean =
			this.email.trim().length > 0;
		const hasAltcha: boolean =
			!this.altchaEnabled || this.altchaPayload !== null;
		return hasEmail && hasAltcha && !this.isLoading();
	}

	/**
	 * Submits the forgot password request. Shows a confirmation message regardless
	 * of outcome to avoid disclosing whether the email exists.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (!this.email.trim())
		{
			this.notification.error("Please enter your email address.");
			return;
		}

		if (!this.isValidEmail())
		{
			this.notification.error("Please enter a valid email address.");
			return;
		}

		if (this.altchaEnabled && !this.altchaPayload)
		{
			this.notification.error("Please complete the verification challenge.");
			return;
		}

		this.isLoading.set(true);

		this
			.authService
			.requestPasswordReset(
				this.email,
				this.altchaPayload)
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
