/**
 * Login page with local and OAuth options.
 * Most of the app works without login (guest access).
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
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthResponse, LoginRequest } from "@auth/models";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { RecaptchaService } from "@shared/services/recaptcha.service";

@Component(
	{
		selector: "app-login",
		standalone: true,
		imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./login.html",
		styleUrl: "./login.scss"
	})
/**
 * Component that handles user login via local credentials or OAuth providers.
 * Manages redirects on success and presents user-friendly error messages.
 */
export class LoginComponent implements OnInit
{
	/**
	 * Auth service for performing login operations.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Router for navigation after successful login.
	 * @type {Router}
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Activated route for reading returnUrl query parameter.
	 * @type {ActivatedRoute}
	 */
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);

	/**
	 * Notification service for showing messages to the user.
	 * @type {NotificationService}
	 */
	private readonly notification: NotificationService =
		inject(NotificationService);

	/**
	 * reCAPTCHA service for bot protection.
	 * @type {RecaptchaService}
	 */
	private readonly recaptchaService: RecaptchaService =
		inject(RecaptchaService);

	/**
	 * Username or email entered by the user in the login form.
	 * @type {string}
	 */
	protected usernameOrEmail: string = "";

	/**
	 * Password entered by the user.
	 * @type {string}
	 */
	protected password: string = "";

	/**
	 * When true, persist session using "remember me" semantics.
	 * @type {boolean}
	 */
	protected rememberMe: boolean = false;

	/**
	 * Loading state used while an authentication request is in-flight.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * URL to navigate to after successful login. Defaults to application root.
	 * @type {string}
	 */
	private returnUrl: string = "/";

	/**
	 * Initialize component: determine post-login redirect and redirect if already authenticated.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		this.returnUrl =
			this.route.snapshot.queryParams["returnUrl"] ?? "/";

		// Redirect if already authenticated
		if (this.authService.isAuthenticated())
		{
			this.router.navigateByUrl(this.returnUrl);
		}
	}

	/**
	 * Perform local credential login. Validates form, invokes AuthService, and
	 * handles success and error flows with notifications and redirects.
	 * @returns {Promise<void>}
	 */
	protected async onLocalLoginAsync(): Promise<void>
	{
		if (!this.usernameOrEmail || !this.password)
		{
			this.notification.error("Please enter username and password.");
			return;
		}

		this.isLoading.set(true);

		try
		{
			// Get reCAPTCHA token (null if disabled)
			const recaptchaToken: string | null =
				await this.recaptchaService.executeAsync("login");

			const credentials: LoginRequest =
				{
					usernameOrEmail: this.usernameOrEmail,
					password: this.password,
					rememberMe: this.rememberMe,
					recaptchaToken
				};

			this
			.authService
			.login(credentials)
			.subscribe(
				{
					next: (response: AuthResponse) =>
						this.handleLoginSuccess(response),
					error: (error: HttpErrorResponse) =>
						this.handleLoginError(error)
				});
		}
		catch
		{
			this.notification.error("Failed to verify request. Please try again.");
			this.isLoading.set(false);
		}
	}

	/**
	 * Handle successful login response. Redirects to password change if required,
	 * otherwise navigates to the return URL.
	 * @param response
	 * The authentication response from the server.
	 * @returns {void}
	 */
	private handleLoginSuccess(response: AuthResponse): void
	{
		if (response.requiresPasswordChange)
		{
			this.notification.info(
				"You must change your password before continuing.");
			this.router.navigate(
				["/auth/change-password"],
				{
					queryParams: {
						required: "true",
						returnUrl: this.returnUrl
					}
				});
		}
		else
		{
			this.router.navigateByUrl(this.returnUrl);
		}
	}

	/**
	 * Handle login error response. Displays error notification with details
	 * and resets loading state.
	 * @param error
	 * The HTTP error response from the server.
	 * @returns {void}
	 */
	private handleLoginError(error: HttpErrorResponse): void
	{
		const details: string[] =
			this.getLoginErrorDetails(error);
		this.notification.errorWithDetails("Login Failed", details);
		this.isLoading.set(false);
	}

	/**
	 * Start OAuth login flow with GitHub provider.
	 * @returns {void}
	 */
	protected onGitHubLogin(): void
	{
		this.isLoading.set(true);
		this.authService.loginWithProvider("github", this.returnUrl);
	}

	/**
	 * Extracts user-friendly error details from login failure.
	 * @param {HttpErrorResponse} error
	 * Error response received from the login request.
	 * @returns {string[]}
	 * Array of human-readable error messages for display in a detail panel.
	 */
	private getLoginErrorDetails(error: HttpErrorResponse): string[]
	{
		switch (error.status)
		{
			case 401:
				return [
					"Invalid username or password",
					"Check your credentials and try again"
				];
			case 0:
				return [
					"Unable to connect to server",
					"Check your internet connection"
				];
			case 429:
				return [
					"Too many login attempts",
					"Please wait before trying again"
				];
			default:
				return [error.error?.detail ?? "An unexpected error occurred"];
		}
	}
}
