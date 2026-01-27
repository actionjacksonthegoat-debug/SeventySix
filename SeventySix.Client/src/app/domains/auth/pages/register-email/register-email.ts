/**
 * Registration email entry page.
 * First step of self-registration flow - user enters email address.
 * Always shows confirmation after submit (prevents email enumeration).
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
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";

@Component(
	{
		selector: "app-register-email",
		standalone: true,
		imports: [FormsModule, RouterLink, MatButtonModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./register-email.html",
		styleUrl: "./register-email.scss"
	})
/**
 * First step of the self-registration flow - collects an email address and
 * initiates the registration process without revealing whether the email exists.
 */
export class RegisterEmailComponent
{
	/**
	 * Auth service used to initiate the registration flow.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Notification service used to show success or error messages.
	 * @type {NotificationService}
	 */
	private readonly notification: NotificationService =
		inject(NotificationService);

	/**
	 * Email address entered by the user for registration initiation.
	 * @type {string}
	 */
	protected email: string = "";

	/**
	 * Loading state while the initiation request is in-flight.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * True when the initiation request has been submitted (controls UI state).
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly submitted: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Validates email format using simple regex.
	 * @returns {boolean}
	 * True when `email` appears to be a valid address.
	 */
	protected isValidEmail(): boolean
	{
		const emailRegex: RegExp =
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(this.email);
	}

	/**
	 * Submits the registration initiation request.
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
			.initiateRegistration(this.email)
			.subscribe(
				{
					next: () =>
					{
						this.submitted.set(true);
						this.isLoading.set(false);
					},
					error: () =>
					{
						// Still show success to prevent email enumeration
						this.submitted.set(true);
						this.isLoading.set(false);
					}
				});
	}
}
