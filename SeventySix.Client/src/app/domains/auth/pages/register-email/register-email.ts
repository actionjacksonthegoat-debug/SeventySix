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
import { RouterLink } from "@angular/router";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";

@Component(
	{
		selector: "app-register-email",
		standalone: true,
		imports: [FormsModule, RouterLink],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./register-email.html",
		styleUrl: "./register-email.scss"
	})
export class RegisterEmailComponent
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
	 * Submits the registration initiation request.
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
