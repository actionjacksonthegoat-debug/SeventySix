/**
 * Set password page for token-based password reset.
 * Used when a user receives a password reset email from an admin.
 */

import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	OnInit,
	Signal,
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
import { ActivatedRoute, Router } from "@angular/router";
import { ValidationResult } from "@auth/models";
import { mapAuthError } from "@auth/utilities";
import { validatePassword, validatePasswordsMatch } from "@auth/utilities";
import { APP_ROUTES } from "@shared/constants";
import { PASSWORD_VALIDATION } from "@shared/constants/validation.constants";
import { AuthErrorResult } from "@shared/models";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { getValidationError } from "@shared/utilities";

@Component(
	{
		selector: "app-set-password",
		standalone: true,
		imports: [ReactiveFormsModule, MatButtonModule],
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
	 * Form builder for creating reactive forms.
	 * @type {FormBuilder}
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Minimum password length enforced by validation rules.
	 * @type {number}
	 */
	protected readonly PASSWORD_MIN_LENGTH: number =
		PASSWORD_VALIDATION.MIN_LENGTH;

	/**
	 * Set password form with new password and confirmation fields.
	 * @type {FormGroup}
	 */
	protected readonly setPasswordForm: FormGroup =
		this.formBuilder.group(
			{
				newPassword: [
					"",
					[
						Validators.required,
						Validators.minLength(PASSWORD_VALIDATION.MIN_LENGTH)
					]
				],
				confirmPassword: [
					"",
					[
						Validators.required,
						Validators.minLength(PASSWORD_VALIDATION.MIN_LENGTH)
					]
				]
			});

	/**
	 * Validation error message for new password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly newPasswordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.setPasswordForm.get("newPassword"),
					"New password"));

	/**
	 * Validation error message for confirm password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly confirmPasswordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.setPasswordForm.get("confirmPassword"),
					"Confirm password"));

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
	 * Validates the form inputs before submission.
	 * @returns {boolean} True if validation passes, false otherwise.
	 */
	private validateForm(): boolean
	{
		if (!this.token)
		{
			this.notification.error("Invalid password reset token.");
			return false;
		}

		if (this.setPasswordForm.invalid)
		{
			this.setPasswordForm.markAllAsTouched();
			return false;
		}

		const formValue: typeof this.setPasswordForm.value =
			this.setPasswordForm.value;

		const passwordsMatch: ValidationResult =
			validatePasswordsMatch(
				formValue.newPassword,
				formValue.confirmPassword);
		if (!passwordsMatch.valid)
		{
			this.notification.error(passwordsMatch.errorMessage!);
			return false;
		}

		const passwordResult: ValidationResult =
			validatePassword(formValue.newPassword);
		if (!passwordResult.valid)
		{
			this.notification.error(passwordResult.errorMessage!);
			return false;
		}

		return true;
	}

	/**
	 * Submit the new password after validating the token and inputs.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (!this.validateForm())
		{
			return;
		}

		this.isLoading.set(true);

		const formValue: typeof this.setPasswordForm.value =
			this.setPasswordForm.value;

		this
			.authService
			.setPassword(this.token!, formValue.newPassword)
			.subscribe(
				{
					next: () =>
					{
						this.notification.success(
							"Password set successfully. You can now sign in.");
						this.router.navigate(
							[APP_ROUTES.AUTH.LOGIN]);
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
