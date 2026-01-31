/**
 * Change password page.
 * Handles both required (first login) and voluntary password changes.
 *
 * **Design Note:** Uses HttpClient directly (not ApiService) because password
 * change requires `withCredentials: true` for secure cookie handling.
 *
 * @see {@link ApiService} for documentation on when to use HttpClient directly
 */

import { HttpClient, HttpErrorResponse } from "@angular/common/http";
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
import {
	mapAuthError,
	sanitizeRedirectUrl,
	validatePassword,
	validatePasswordsMatch
} from "@auth/utilities";
import { environment } from "@environments/environment";
import { APP_ROUTES } from "@shared/constants";
import { PASSWORD_VALIDATION } from "@shared/constants/validation.constants";
import { AuthErrorResult } from "@shared/models";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { getValidationError } from "@shared/utilities";

interface ChangePasswordRequest
{
	currentPassword: string | null;
	newPassword: string;
}

@Component(
	{
		selector: "app-change-password",
		standalone: true,
		imports: [ReactiveFormsModule, MatButtonModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./change-password.html",
		styleUrl: "./change-password.scss"
	})
/**
 * Page for changing a user's password (required or voluntary flows).
 * Validates passwords and submits change requests to the API.
 */
export class ChangePasswordComponent implements OnInit
{
	/**
	 * HTTP client used to call the change-password API endpoint.
	 * @type {HttpClient}
	 */
	private readonly http: HttpClient =
		inject(HttpClient);

	/**
	 * Auth service for clearing requirement and session-related checks.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Router used to navigate after a successful password change.
	 * @type {Router}
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Activated route used to read query parameters (required flag/returnUrl).
	 * @type {ActivatedRoute}
	 */
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);

	/**
	 * Notification service for showing success/error messages to the user.
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
	 * Change password form with current password, new password, and confirmation fields.
	 * @type {FormGroup}
	 */
	protected readonly changePasswordForm: FormGroup =
		this.formBuilder.group(
			{
				currentPassword: [
					"",
					[Validators.required]
				],
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
	 * Validation error message for current password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly currentPasswordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.changePasswordForm.get("currentPassword"),
					"Current password"));

	/**
	 * Validation error message for new password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly newPasswordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.changePasswordForm.get("newPassword"),
					"New password"));

	/**
	 * Validation error message for confirm password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly confirmPasswordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.changePasswordForm.get("confirmPassword"),
					"Confirm password"));

	/**
	 * Loading state while the change password request is in-flight.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);
	/**
	 * Whether the password change is required for the user (first-login flow).
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isRequired: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Redirect URL after successful password change.
	 * @type {string}
	 */
	private returnUrl: string = "/";

	/**
	 * Component initialization - determine whether a password change is required
	 * and validate the reset token presence.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		// Check if password change is required (from query param or auth state)
		const requiredParam: string | null =
			this.route.snapshot.queryParams["required"];
		this.isRequired.set(
			requiredParam === "true"
				|| this.authService.requiresPasswordChange());

		// Sanitize returnUrl to prevent open redirect vulnerabilities
		this.returnUrl =
			sanitizeRedirectUrl(this.route.snapshot.queryParams["returnUrl"]);

		// Redirect if not authenticated
		if (!this.authService.isAuthenticated())
		{
			this.router.navigate(
				[APP_ROUTES.AUTH.LOGIN]);
		}
	}

	/**
	 * Validates the form inputs before submission.
	 * @returns {boolean} True if validation passes, false otherwise.
	 */
	private validateForm(): boolean
	{
		if (this.changePasswordForm.invalid)
		{
			this.changePasswordForm.markAllAsTouched();
			return false;
		}

		const formValue: typeof this.changePasswordForm.value =
			this.changePasswordForm.value;

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
	 * Submit the change password request after validating inputs.
	 * Shows notifications and redirects on success.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (!this.validateForm())
		{
			return;
		}

		this.isLoading.set(true);

		const formValue: typeof this.changePasswordForm.value =
			this.changePasswordForm.value;
		const request: ChangePasswordRequest =
			{
				currentPassword: formValue.currentPassword,
				newPassword: formValue.newPassword
			};

		this
			.http
			.post<void>(`${environment.apiUrl}/auth/password/change`, request,
				{
					withCredentials: true
				})
			.subscribe(
				{
					next: () =>
					{
						this.notification.success(
							"Password changed successfully. Please log in again.");
						// Clear auth state locally (server already revoked tokens) and redirect to login
						this.authService.forceLogoutLocally();
						// The API clears the refresh token, so user needs to log in again
						this.router.navigate(
							[APP_ROUTES.AUTH.LOGIN],
							{
								queryParams: { returnUrl: this.returnUrl }
							});
					},
					error: (error: HttpErrorResponse) =>
					{
						const errorResult: AuthErrorResult =
							mapAuthError(error);
						this.notification.error(errorResult.message);
						this.isLoading.set(false);
					}
				});
	}
}
