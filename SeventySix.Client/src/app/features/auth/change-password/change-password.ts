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
import { AuthService } from "@infrastructure/services/auth.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import { PASSWORD_VALIDATION } from "@shared/constants/validation.constants";

interface ChangePasswordRequest
{
	currentPassword: string | null;
	newPassword: string;
}

@Component({
	selector: "app-change-password",
	standalone: true,
	imports: [FormsModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: "./change-password.html",
	styleUrl: "./change-password.scss"
})
export class ChangePasswordComponent implements OnInit
{
	private readonly http: HttpClient =
		inject(HttpClient);
	private readonly authService: AuthService =
		inject(AuthService);
	private readonly router: Router =
		inject(Router);
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);
	private readonly notification: NotificationService =
		inject(NotificationService);

	protected readonly PASSWORD_MIN_LENGTH: number =
		PASSWORD_VALIDATION.MIN_LENGTH;

	protected currentPassword: string = "";
	protected newPassword: string = "";
	protected confirmPassword: string = "";

	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);
	protected readonly isRequired: WritableSignal<boolean> =
		signal<boolean>(false);

	private returnUrl: string = "/";

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
			this.router.navigate(["/auth/login"]);
		}
	}

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
			.post<void>(`${environment.apiUrl}/auth/change-password`, request, {
				withCredentials: true
			})
			.subscribe({
				next: () =>
				{
					this.notification.success(
						"Password changed successfully. Please log in again.");
					// Clear auth state and redirect to login
					this.authService.clearPasswordChangeRequirement();
					// The API clears the refresh token, so user needs to log in again
					this.router.navigate(["/auth/login"], {
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
}
