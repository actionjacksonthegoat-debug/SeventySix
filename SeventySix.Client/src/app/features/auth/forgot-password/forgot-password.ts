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
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";

@Component(
	{
		selector: "app-forgot-password",
		standalone: true,
		imports: [FormsModule, RouterLink],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./forgot-password.html",
		styleUrl: "./forgot-password.scss"
	})
export class ForgotPasswordComponent
{
	private readonly authService: AuthService =
		inject(AuthService);
	private readonly notification: NotificationService =
		inject(NotificationService);

	protected email: string = "";

	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);
	protected readonly submitted: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Validates email format using simple regex.
	 */
	protected isValidEmail(): boolean
	{
		const emailRegex: RegExp =
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(this.email);
	}

	/**
	 * Submits the forgot password request.
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
