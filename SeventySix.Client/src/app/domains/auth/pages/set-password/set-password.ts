/**
 * Set password page for token-based password reset.
 * Used when a user receives a password reset email from an admin.
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
import { ActivatedRoute, Router } from "@angular/router";
import { ValidationResult } from "@auth/models";
import { mapAuthError } from "@auth/utilities";
import { validatePassword, validatePasswordsMatch } from "@auth/utilities";
import { PASSWORD_VALIDATION } from "@shared/constants/validation.constants";
import { AuthErrorResult } from "@shared/models";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";

@Component(
	{
		selector: "app-set-password",
		standalone: true,
		imports: [FormsModule, MatButtonModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./set-password.html",
		styleUrl: "./set-password.scss"
	})
/**
 * Token-based password reset page. Validates the reset token and enforces
 * password complexity rules when setting a new password.
 */
export class SetPasswordComponent implements OnInit
{
	/**
	 * Auth service used to validate tokens and set the new password.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Router used to navigate after successful password set.
	 * @type {Router}
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Activated route used to obtain the password reset token.
	 * @type {ActivatedRoute}
	 */
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);

	/**
	 * Notification service for user-facing messages.
	 * @type {NotificationService}
	 */
	private readonly notification: NotificationService =
		inject(NotificationService);

	/**
	 * Minimum password length enforced by validation rules.
	 * @type {number}
	 */
	protected readonly PASSWORD_MIN_LENGTH: number =
		PASSWORD_VALIDATION.MIN_LENGTH;

	/**
	 * New password entered by the user.
	 * @type {string}
	 */
	protected newPassword: string = "";

	/**
	 * Confirmation of the new password.
	 * @type {string}
	 */
	protected confirmPassword: string = "";

	/**
	 * Loading state while the set-password request is being processed.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * True when the provided password reset token is invalid/expired.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly tokenValid: WritableSignal<boolean> =
		signal<boolean>(true);

	/**
	 * Token extracted from the password reset link.
	 * @type {string}
	 */
	private token: string = "";

	/**
	 * Component initialization - validate token presence and inform the user if invalid.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		this.token =
			this.route.snapshot.queryParams["token"] ?? "";

		if (!this.token)
		{
			this.tokenValid.set(false);
			this.notification.error(
				"Invalid password reset link. Please request a new one.");
		}
	}

	/**
	 * Submit the new password after validating the token and inputs.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (!this.token)
		{
			this.notification.error("Invalid password reset token.");
			return;
		}

		const passwordsMatch: ValidationResult =
			validatePasswordsMatch(
				this.newPassword,
				this.confirmPassword);
		if (!passwordsMatch.valid)
		{
			this.notification.error(passwordsMatch.errorMessage!);
			return;
		}

		const passwordResult: ValidationResult =
			validatePassword(this.newPassword);
		if (!passwordResult.valid)
		{
			this.notification.error(passwordResult.errorMessage!);
			return;
		}

		this.isLoading.set(true);

		this
		.authService
		.setPassword(this.token, this.newPassword)
		.subscribe(
			{
				next: () =>
				{
					this.notification.success(
						"Password set successfully. You can now sign in.");
					this.router.navigate(
						["/auth/login"]);
				},
				error: (error: HttpErrorResponse) =>
				{
					const errorResult: AuthErrorResult =
						mapAuthError(error);
					if (errorResult.invalidateToken)
					{
						this.tokenValid.set(false);
					}
					this.notification.error(errorResult.message);
					this.isLoading.set(false);
				}
			});
	}
}
