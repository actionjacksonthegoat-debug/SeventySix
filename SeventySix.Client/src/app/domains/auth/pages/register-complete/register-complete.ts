/**
 * Registration completion page.
 * Shown after user clicks verification link in email.
 * User enters username and password to complete account creation.
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
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ValidationResult } from "@auth/models";
import { mapAuthError, validateRegistrationForm } from "@auth/utilities";
import {
	PASSWORD_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants";
import { FORM_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { AuthErrorResult } from "@shared/models";
import { AuthService, NotificationService } from "@shared/services";
import { getValidationError } from "@shared/utilities";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

@Component(
	{
		selector: "app-register-complete",
		standalone: true,
		imports: [
			ReactiveFormsModule,
			RouterLink,
			...FORM_MATERIAL_MODULES
		],
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
	 * Angular destroy reference for automatic subscription cleanup.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

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

	/**
	 * Form builder for creating reactive forms.
	 * @type {FormBuilder}
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Registration completion form with username, password, and confirmation fields.
	 * @type {FormGroup}
	 */
	protected readonly registerForm: FormGroup =
		this.formBuilder.group(
			{
				username: [
					"",
					[
						Validators.required,
						Validators.minLength(USERNAME_VALIDATION.MIN_LENGTH),
						Validators.maxLength(USERNAME_VALIDATION.MAX_LENGTH),
						Validators.pattern(USERNAME_VALIDATION.PATTERN)
					]
				],
				password: [
					"",
					[
						Validators.required,
						Validators.minLength(PASSWORD_VALIDATION.MIN_LENGTH),
						Validators.maxLength(PASSWORD_VALIDATION.MAX_LENGTH)
					]
				],
				confirmPassword: [
					"",
					[
						Validators.required,
						Validators.minLength(PASSWORD_VALIDATION.MIN_LENGTH),
						Validators.maxLength(PASSWORD_VALIDATION.MAX_LENGTH)
					]
				]
			});

	/**
	 * Validation error message for username field.
	 * @type {Signal<string | null>}
	 */
	protected readonly usernameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.registerForm.get("username"),
					"Username"));

	/**
	 * Validation error message for password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly passwordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.registerForm.get("password"),
					"Password"));

	/**
	 * Validation error message for confirm password field.
	 * @type {Signal<string | null>}
	 */
	protected readonly confirmPasswordError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.registerForm.get("confirmPassword"),
					"Confirm password"));

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

		if (isNullOrUndefined(this.token) || this.token === "")
		{
			this.tokenValid.set(false);
			this.notification.error(
				"Invalid registration link. Please request a new one.");
		}
	}

	/**
	 * Checks if form can be submitted.
	 * @returns {boolean}
	 * True when all required fields are valid.
	 */
	protected canSubmit(): boolean
	{
		return this.registerForm.valid && this.tokenValid() && !this.isLoading();
	}

	/**
	 * Submits the registration completion request.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (this.registerForm.invalid)
		{
			this.registerForm.markAllAsTouched();
			return;
		}

		if (!this.validateForm())
		{
			return;
		}

		this.isLoading.set(true);

		const formValue: typeof this.registerForm.value =
			this.registerForm.value;

		this
			.authService
			.completeRegistration(
				this.token,
				formValue.username,
				formValue.password)
			.pipe(
				takeUntilDestroyed(this.destroyRef))
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

	/**
	 * Validate the entered username and passwords before submission.
	 * @returns {boolean}
	 * True when the form satisfies basic validation rules.
	 */
	private validateForm(): boolean
	{
		const formValue: typeof this.registerForm.value =
			this.registerForm.value;
		const result: ValidationResult =
			validateRegistrationForm(
				formValue.username,
				formValue.password,
				formValue.confirmPassword);
		if (!result.valid)
		{
			this.notification.error(result.errorMessage!);
			return false;
		}

		return true;
	}
}
