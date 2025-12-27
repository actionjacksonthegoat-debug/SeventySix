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
import { RouterLink } from "@angular/router";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";

@Component(
	{
		selector: "app-forgot-password",
		standalone: true,
		imports: [FormsModule, RouterLink],
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
	 * Validates email format using simple regex.
	 * @returns {boolean}
	 * True when `email` is a valid-looking address.
	 */
	protected isValidEmail(): boolean
	{
		const emailRegex: RegExp =
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(this.email);
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

		this.isLoading.set(true);

		this
		.authService
		.requestPasswordReset(this.email)
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
