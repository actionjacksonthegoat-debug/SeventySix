/**
 * Registration completion page.
 * Shown after user clicks verification link in email.
 * User enters username and password to complete account creation.
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
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AUTH_ERROR_CODE } from "@auth/constants";
import {
	HTTP_STATUS,
	PASSWORD_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";

@Component(
	{
		selector: "app-register-complete",
		standalone: true,
		imports: [FormsModule, RouterLink],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./register-complete.html",
		styleUrl: "./register-complete.scss"
	})
/**
 * Completes user registration using a token from email verification.
 * Collects username/password and validates the token with the API.
 */
export class RegisterCompleteComponent implements OnInit
{
	/**
	 * Auth service used to validate tokens and complete registration.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Router used to navigate on success.
	 * @type {Router}
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Activated route used to read verification token from query params.
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

	// Expose validation constants to template
	/**
	 * Minimum username length exposed to the template.
	 * @type {number}
	 */
	protected readonly USERNAME_MIN_LENGTH: number =
		USERNAME_VALIDATION.MIN_LENGTH;

	/**
	 * Maximum username length exposed to the template.
	 * @type {number}
	 */
	protected readonly USERNAME_MAX_LENGTH: number =
		USERNAME_VALIDATION.MAX_LENGTH;

	/**
	 * Username pattern string used by the template for validation.
	 * @type {string}
	 */
	protected readonly USERNAME_PATTERN: string =
		USERNAME_VALIDATION.PATTERN_STRING;

	/**
	 * Minimum password length exposed to the template.
	 * @type {number}
	 */
	protected readonly PASSWORD_MIN_LENGTH: number =
		PASSWORD_VALIDATION.MIN_LENGTH;

	/**
	 * Username entered by the user during registration completion.
	 * @type {string}
	 */
	protected username: string = "";

	/**
	 * Password entered by the user.
	 * @type {string}
	 */
	protected password: string = "";

	/**
	 * Confirmation of the entered password.
	 * @type {string}
	 */
	protected confirmPassword: string = "";

	/**
	 * Indicates whether the registration completion request is in progress.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * True when the registration token is known to be invalid or expired.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly tokenValid: WritableSignal<boolean> =
		signal<boolean>(true);

	/**
	 * Token retrieved from the verification link.
	 * @type {string}
	 */
	private token: string = "";

	/**
	 * Component initialization - validate token and prepare UI state.
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
				"Invalid registration link. Please request a new one.");
		}
	}

	/**
	 * Submits the registration completion request.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (!this.validateForm())
		{
			return;
		}

		this.isLoading.set(true);

		this
		.authService
		.completeRegistration(this.token, this.username, this.password)
		.subscribe(
			{
				next: () =>
				{
					this.notification.success("Account created successfully!");
					this.router.navigate(
						["/"]);
				},
				error: (error: HttpErrorResponse) =>
				{
					const message: string =
						this.getErrorMessage(error);
					this.notification.error(message);
					this.isLoading.set(false);
				}
			});
	}

	/**
	 * Validate the entered username and passwords before submission.
	 * @returns {boolean}
	 * True when the form satisfies basic validation rules.
	 */
	private validateForm(): boolean
	{
		if (
			!this.username
				|| this.username.length < USERNAME_VALIDATION.MIN_LENGTH)
		{
			this.notification.error(
				`Username must be at least ${USERNAME_VALIDATION.MIN_LENGTH} characters.`);
			return false;
		}

		if (!USERNAME_VALIDATION.PATTERN.test(this.username))
		{
			this.notification.error(
				"Username can only contain letters, numbers, and underscores.");
			return false;
		}

		if (
			!this.password
				|| this.password.length < PASSWORD_VALIDATION.MIN_LENGTH)
		{
			this.notification.error(
				`Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters.`);
			return false;
		}

		if (this.password !== this.confirmPassword)
		{
			this.notification.error("Passwords do not match.");
			return false;
		}

		return true;
	}

	/**
	 * Extracts a user-friendly error message for registration completion failures.
	 * @param {HttpErrorResponse} error
	 * HTTP error response from the API.
	 * @returns {string}
	 * Localized message appropriate for display to the user.
	 */
	private getErrorMessage(error: HttpErrorResponse): string
	{
		if (error.status === HTTP_STATUS.BAD_REQUEST)
		{
			const errorCode: string =
				error.error?.extensions?.errorCode;

			switch (errorCode)
			{
				case AUTH_ERROR_CODE.INVALID_TOKEN:
				case AUTH_ERROR_CODE.TOKEN_EXPIRED:
					this.tokenValid.set(false);
					return "This link has expired. Please request a new one.";
				case AUTH_ERROR_CODE.USERNAME_EXISTS:
					return "This username is already taken. Please choose another.";
				default:
					return (
						error.error?.detail
							?? "Invalid request. Please check your input.");
			}
		}

		return "An unexpected error occurred. Please try again.";
	}
}
