/**
 * Login page with local and OAuth options.
 * Most of the app works without login (guest access).
 */

import { HttpErrorResponse } from "@angular/common/http";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
	OnInit,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthResponse, LoginRequest, MfaState } from "@auth/models";
import { MfaService } from "@auth/services";
import { sanitizeRedirectUrl } from "@auth/utilities";
import { AltchaWidgetComponent } from "@shared/components";
import { APP_ROUTES, AUTH_NOTIFICATION_MESSAGES, STORAGE_KEYS } from "@shared/constants";
import { FORM_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { AltchaService, AuthService, NotificationService, StorageService } from "@shared/services";
import { getValidationError } from "@shared/utilities";
import { isPresent } from "@shared/utilities/null-check.utility";

@Component(
	{
		selector: "app-login",
		standalone: true,
		imports: [
			ReactiveFormsModule,
			RouterLink,
			MatIconModule,
			...FORM_MATERIAL_MODULES,
			AltchaWidgetComponent
		],
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
	 * Form builder for creating reactive forms.
	 * @type {FormBuilder}
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Angular destroy reference for automatic subscription cleanup.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Auth service for performing login operations.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * MFA service for storing MFA state.
	 * @type {MfaService}
	 */
	private readonly mfaService: MfaService =
		inject(MfaService);

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
	 * ALTCHA service for bot protection.
	 * @type {AltchaService}
	 */
	private readonly altchaService: AltchaService =
		inject(AltchaService);

	/**
	 * Storage service for reading/clearing the inactivity logout flag.
	 * @type {StorageService}
	 */
	private readonly storageService: StorageService =
		inject(StorageService);

	/**
	 * Whether ALTCHA validation is enabled.
	 * @type {boolean}
	 */
	protected readonly altchaEnabled: boolean =
		this.altchaService.enabled;

	/**
	 * ALTCHA challenge endpoint URL.
	 * @type {string}
	 */
	protected readonly challengeUrl: string =
		this.altchaService.challengeEndpoint;

	/**
	 * Login form with username/email, password, and remember me fields.
	 * @type {FormGroup}
	 */
	protected readonly loginForm: FormGroup =
		this.formBuilder.group(
			{
				usernameOrEmail: [
					"",
					[Validators.required]
				],
				password: [
					"",
					[Validators.required]
				],
				rememberMe: [false]
			});

	/**
	 * Validation error message for username/email field.
	 * @type {Signal<string | null>}
	 */
	protected readonly usernameOrEmailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.loginForm.get("usernameOrEmail"),
					"Username or email"));

	/**
	 * Validation error message for password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly passwordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.loginForm.get("password"),
					"Password"));

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
	 * ALTCHA verification payload from the widget.
	 * @type {WritableSignal<string | null>}
	 * @private
	 */
	private readonly altchaPayload: WritableSignal<string | null> =
		signal<string | null>(null);

	/**
	 * Whether to show the "logged out due to inactivity" banner.
	 */
	private readonly showInactivityBanner: WritableSignal<boolean> =
		signal(false);

	/**
	 * Public readonly signal for the template.
	 * @type {Signal<boolean>}
	 */
	protected readonly inactivityBannerVisible: Signal<boolean> =
		this.showInactivityBanner.asReadonly();

	/**
	 * Initialize component: determine post-login redirect and redirect if already authenticated.
	 * @returns {void}
	 */
	ngOnInit(): void
	{
		// Check for inactivity logout flag before redirect
		const wasIdleLogout: string | null =
			this.storageService.getSessionItem(
				STORAGE_KEYS.AUTH_INACTIVITY_LOGOUT);

		if (isPresent(wasIdleLogout))
		{
			this.showInactivityBanner.set(true);
			this.storageService.removeSessionItem(
				STORAGE_KEYS.AUTH_INACTIVITY_LOGOUT);
		}

		// Sanitize returnUrl to prevent open redirect vulnerabilities
		this.returnUrl =
			sanitizeRedirectUrl(this.route.snapshot.queryParams["returnUrl"]);

		// Redirect if already authenticated
		if (this.authService.isAuthenticated())
		{
			this.router.navigateByUrl(this.returnUrl);
		}
	}

	/**
	 * Handles ALTCHA verification completion.
	 * @param {string} payload
	 * The ALTCHA verification payload.
	 */
	protected onAltchaVerified(payload: string): void
	{
		this.altchaPayload.set(payload);
	}

	/**
	 * Checks if form can be submitted.
	 * @returns {boolean}
	 * True when all required fields are valid.
	 */
	protected canSubmit(): boolean
	{
		const formValid: boolean =
			this.loginForm.valid;
		const hasAltcha: boolean =
			!this.altchaEnabled || this.altchaPayload() !== null;
		return formValid && hasAltcha && !this.isLoading();
	}

	/**
	 * Perform local credential login. Validates form, invokes AuthService, and
	 * handles success and error flows with notifications and redirects.
	 * @returns {void}
	 */
	protected onLocalLogin(): void
	{
		if (this.loginForm.invalid)
		{
			this.loginForm.markAllAsTouched();
			return;
		}

		if (this.altchaEnabled && !this.altchaPayload())
		{
			this.notification.error("Please complete the verification challenge.");
			return;
		}

		this.isLoading.set(true);

		const formValue: typeof this.loginForm.value =
			this.loginForm.value;
		const credentials: LoginRequest =
			{
				usernameOrEmail: formValue.usernameOrEmail,
				password: formValue.password,
				rememberMe: formValue.rememberMe,
				altchaPayload: this.altchaPayload()
			};

		this
			.authService
			.login(credentials)
			.pipe(
				takeUntilDestroyed(this.destroyRef))
			.subscribe(
				{
					next: (response: AuthResponse) =>
						this.handleLoginSuccess(response),
					error: (error: HttpErrorResponse) =>
						this.handleLoginError(error)
				});
	}

	/**
	 * Handle successful login response. Redirects to MFA verify if required,
	 * password change if required, otherwise navigates to the return URL.
	 * @param response
	 * The authentication response from the server.
	 * @returns {void}
	 */
	private handleLoginSuccess(response: AuthResponse): void
	{
		if (response.requiresMfa)
		{
			const mfaState: MfaState =
				{
					challengeToken: response.mfaChallengeToken ?? "",
					email: response.email ?? "",
					returnUrl: this.returnUrl,
					mfaMethod: response.mfaMethod,
					availableMfaMethods: response.availableMfaMethods
				};
			this.mfaService.setMfaState(mfaState);
			this.router.navigate(
				[APP_ROUTES.AUTH.MFA_VERIFY]);
			return;
		}

		if (response.requiresPasswordChange)
		{
			this.notification.info(
				AUTH_NOTIFICATION_MESSAGES.PASSWORD_CHANGE_REQUIRED);
			this.router.navigate(
				[APP_ROUTES.AUTH.CHANGE_PASSWORD],
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
				return ["An unexpected error occurred. Please try again."];
		}
	}
}
