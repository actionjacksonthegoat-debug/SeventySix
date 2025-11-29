/**
 * Set password page for token-based password reset.
 * Used when a user receives a password reset email from an admin.
 */

import {
	Component,
	inject,
	signal,
	WritableSignal,
	ChangeDetectionStrategy,
	OnInit
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";

@Component({
	selector: "app-set-password",
	standalone: true,
	imports: [FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./set-password.component.html",
	styleUrls: ["./set-password.component.scss"]
})
export class SetPasswordComponent implements OnInit
{
	private readonly authService: AuthService = inject(AuthService);
	private readonly router: Router = inject(Router);
	private readonly route: ActivatedRoute = inject(ActivatedRoute);
	private readonly notification: NotificationService =
		inject(NotificationService);

	protected newPassword: string = "";
	protected confirmPassword: string = "";

	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);
	protected readonly tokenValid: WritableSignal<boolean> =
		signal<boolean>(true);

	private token: string = "";

	ngOnInit(): void
	{
		this.token = this.route.snapshot.queryParams["token"] ?? "";

		if (!this.token)
		{
			this.tokenValid.set(false);
			this.notification.error(
				"Invalid password reset link. Please request a new one."
			);
		}
	}

	protected onSubmit(): void
	{
		if (!this.token)
		{
			this.notification.error("Invalid password reset token.");
			return;
		}

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

		this.authService.setPassword(this.token, this.newPassword).subscribe({
			next: () =>
			{
				this.notification.success(
					"Password set successfully. You can now sign in."
				);
				this.router.navigate(["/auth/login"]);
			},
			error: (error: HttpErrorResponse) =>
			{
				const message: string = this.getErrorMessage(error);
				this.notification.error(message);
				this.isLoading.set(false);
			}
		});
	}

	/**
	 * Extracts user-friendly error message from set password failure.
	 */
	private getErrorMessage(error: HttpErrorResponse): string
	{
		switch (error.status)
		{
			case 400:
				return (
					error.error?.detail
					?? "Invalid request. Please check your password requirements."
				);
			case 404:
				return "Password reset link has expired or is invalid. Please request a new one.";
			case 0:
				return "Unable to connect to server. Check your internet connection.";
			default:
				return error.error?.detail ?? "An unexpected error occurred.";
		}
	}
}
