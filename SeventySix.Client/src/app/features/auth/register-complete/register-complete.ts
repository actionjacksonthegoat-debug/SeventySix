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
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import {
	PASSWORD_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants/validation.constants";

@Component({
	selector: "app-register-complete",
	standalone: true,
	imports: [FormsModule, RouterLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./register-complete.html",
	styleUrl: "./register-complete.scss"
})
export class RegisterCompleteComponent implements OnInit
{
	private readonly authService: AuthService =
		inject(AuthService);
	private readonly router: Router =
		inject(Router);
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);
	private readonly notification: NotificationService =
		inject(NotificationService);

	// Expose validation constants to template
	protected readonly USERNAME_MIN_LENGTH: number =
		USERNAME_VALIDATION.MIN_LENGTH;
	protected readonly USERNAME_MAX_LENGTH: number =
		USERNAME_VALIDATION.MAX_LENGTH;
	protected readonly USERNAME_PATTERN: string =
		USERNAME_VALIDATION.PATTERN_STRING;
	protected readonly PASSWORD_MIN_LENGTH: number =
		PASSWORD_VALIDATION.MIN_LENGTH;

	protected username: string = "";
	protected password: string = "";
	protected confirmPassword: string = "";

	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);
	protected readonly tokenValid: WritableSignal<boolean> =
		signal<boolean>(true);

	private token: string = "";

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
			.subscribe({
				next: () =>
				{
					this.notification.success("Account created successfully!");
					this.router.navigate(["/"]);
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

	private getErrorMessage(error: HttpErrorResponse): string
	{
		if (error.status === 400)
		{
			const errorCode: string =
				error.error?.extensions?.errorCode;

			switch (errorCode)
			{
				case "INVALID_TOKEN":
				case "TOKEN_EXPIRED":
					this.tokenValid.set(false);
					return "This link has expired. Please request a new one.";
				case "USERNAME_EXISTS":
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
