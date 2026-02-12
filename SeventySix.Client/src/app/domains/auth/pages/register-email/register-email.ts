/**
 * Registration email entry page.
 * First step of self-registration flow - user enters email address.
 * Always shows confirmation after submit (prevents email enumeration).
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	DestroyRef,
	inject,
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
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { AltchaWidgetComponent } from "@shared/components";
import { AltchaService } from "@shared/services/altcha.service";
import { AuthService } from "@shared/services/auth.service";
import { NotificationService } from "@shared/services/notification.service";
import { getValidationError } from "@shared/utilities";

@Component(
	{
		selector: "app-register-email",
		standalone: true,
		imports: [ReactiveFormsModule, RouterLink, MatButtonModule, AltchaWidgetComponent],
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./register-email.html",
		styleUrl: "./register-email.scss"
	})
/**
 * First step of the self-registration flow - collects an email address and
 * initiates the registration process without revealing whether the email exists.
 */
export class RegisterEmailComponent
{
	/**
	 * Destroy reference for automatic subscription cleanup.
	 * @type {DestroyRef}
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Auth service used to initiate the registration flow.
	 * @type {AuthService}
	 */
	private readonly authService: AuthService =
		inject(AuthService);

	/**
	 * Altcha service for Proof-of-Work captcha configuration.
	 * @type {AltchaService}
	 */
	private readonly altchaService: AltchaService =
		inject(AltchaService);

	/**
	 * Whether ALTCHA verification is enabled.
	 * @type {boolean}
	 */
	protected readonly altchaEnabled: boolean =
		this.altchaService.enabled;

	/**
	 * Challenge endpoint URL for the ALTCHA widget.
	 * @type {string}
	 */
	protected readonly challengeUrl: string =
		this.altchaService.challengeEndpoint;

	/**
	 * ALTCHA verification payload from the widget.
	 * @type {WritableSignal<string | null>}
	 */
	private readonly altchaPayload: WritableSignal<string | null> =
		signal<string | null>(null);

	/**
	 * Notification service used to show success or error messages.
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
	 * Registration email form with email field.
	 * @type {FormGroup}
	 */
	protected readonly registerForm: FormGroup =
		this.formBuilder.group(
			{
				email: [
					"",
					[
						Validators.required,
						Validators.email
					]
				]
			});

	/**
	 * Validation error message for email field.
	 * @type {Signal<string | null>}
	 */
	protected readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(
					this.registerForm.get("email"),
					"Email"));

	/**
	 * Loading state while the initiation request is in-flight.
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly isLoading: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * True when the initiation request has been submitted (controls UI state).
	 * @type {WritableSignal<boolean>}
	 */
	protected readonly submitted: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Checks if form can be submitted.
	 * @returns {boolean}
	 * True when form is valid and not loading.
	 */
	protected canSubmit(): boolean
	{
		const hasAltcha: boolean =
			!this.altchaEnabled || this.altchaPayload() !== null;

		return this.registerForm.valid && !this.isLoading() && hasAltcha;
	}

	/**
	 * Handles ALTCHA widget verification completion.
	 * @param {string} payload
	 * The ALTCHA payload from the widget.
	 */
	protected onAltchaVerified(payload: string): void
	{
		this.altchaPayload.set(payload);
	}

	/**
	 * Submits the registration initiation request.
	 * @returns {void}
	 */
	protected onSubmit(): void
	{
		if (this.registerForm.invalid)
		{
			this.registerForm.markAllAsTouched();
			return;
		}

		if (this.altchaEnabled && !this.altchaPayload())
		{
			this.notification.error(
				"Please complete the verification challenge.");
			return;
		}

		this.isLoading.set(true);

		const email: string =
			this.registerForm.value.email;

		this
			.authService
			.initiateRegistration(
				email,
				this.altchaPayload())
			.pipe(
				takeUntilDestroyed(this.destroyRef))
			.subscribe(
				{
					next: () =>
					{
						this.submitted.set(true);
						this.isLoading.set(false);
					},
					error: () =>
					{
						// Still show success to prevent email enumeration
						this.submitted.set(true);
						this.isLoading.set(false);
					}
				});
	}
}
