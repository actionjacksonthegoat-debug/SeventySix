/**
 * Change password page.
 * Handles both required (first login) and voluntary password changes.
 */

import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
	WritableSignal
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "@environments/environment";
import { PASSWORD_VALIDATION } from "@shared/constants/validation.constants";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";

interface ChangePasswordRequest
{
	currentPassword: string | null;
	newPassword: string;
}

@Component(
	{
		selector: "app-change-password",
		standalone: true,
		imports: [FormsModule],
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
	 * Minimum password length enforced by validation rules.
	 * @type {number}
	 */
	protected readonly PASSWORD_MIN_LENGTH: number =
		PASSWORD_VALIDATION.MIN_LENGTH;

	/**
	 * Current (existing) password entered by the user when required.
	 * @type {string}
	 */
	protected currentPassword: string = "";

	/**
	 * New password to set for the account.
	 * @type {string}
	 */
	protected newPassword: string = "";

	/**
	 * Confirmation of the new password (must match `newPassword`).
	 * @type {string}
	 */
	protected confirmPassword: string = "";

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
		this.returnUrl =
			this.route.snapshot.queryParams["returnUrl"] ?? "/";

		// Redirect if not authenticated
		if (!this.authService.isAuthenticated())
		{
			this.router.navigate(
				["/auth/login"]);
		}
	}

	/**
	 * Submit the change password request after validating inputs.
	 * Shows notifications and redirects on success.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (this.newPassword !== this.confirmPassword)
		{
			this.notification.error("Passwords do not match.");
			return;
		}

		if (this.newPassword.length < 8)
		{
			this.notification.error("Password must be at least 8 characters.");
			return;
		}

		this.isLoading.set(true);

		const request: ChangePasswordRequest =
			{
				currentPassword: this.currentPassword,
				newPassword: this.newPassword
			};

		this
		.http
		.post<void>(`${environment.apiUrl}/auth/change-password`, request,
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
						["/auth/login"],
						{
							queryParams: { returnUrl: this.returnUrl }
						});
				},
				error: (error: HttpErrorResponse) =>
				{
					const message: string =
						error.error?.detail
							?? "Failed to change password. Please try again.";
					this.notification.error(message);
					this.isLoading.set(false);
				}
			});
	}

	/**
	 * Extracts a user-facing error message from the password change response.
	 * @param {HttpErrorResponse} error
	 * Error object returned by the backend.
	 * @returns {string}
	 * A human-readable message suitable for display.
	 */
	private getErrorMessage(error: HttpErrorResponse): string
	{
		switch (error.status)
		{
			case 400:
				return (
					error.error?.detail
						?? "Invalid request. Please check your password requirements.");
			case 404:
				return "Password reset link has expired or is invalid. Please request a new one.";
			case 0:
				return "Unable to connect to server. Check your internet connection.";
			default:
				return error.error?.detail ?? "An unexpected error occurred.";
		}
	}
}