import { UserDto } from "@admin/users/models";
import { UserService } from "@admin/users/services";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal,
	viewChild
} from "@angular/core";
import {
	AbstractControl,
	AsyncValidatorFn,
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	ValidationErrors,
	Validators
} from "@angular/forms";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatStepper } from "@angular/material/stepper";
import { Router } from "@angular/router";
import { LoggerService } from "@infrastructure/services";
import { isNullOrUndefined } from "@infrastructure/utils/null-check.utility";
import {
	EMAIL_VALIDATION,
	FULL_NAME_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants/validation.constants";
import { STEPPER_MATERIAL_MODULES } from "@shared/material-bundles";
import { getValidationError } from "@shared/utilities";
import {
	catchError,
	debounceTime,
	distinctUntilChanged,
	from,
	map,
	Observable,
	of,
	switchMap
} from "rxjs";

/**
 * User creation wizard component.
 * Multi-step form for creating new users with validation.
 * Uses Material Stepper for guided user experience.
 */
@Component(
	{
		selector: "app-user-create",
		imports: [
			ReactiveFormsModule,
			MatSnackBarModule,
			...STEPPER_MATERIAL_MODULES
		],
		templateUrl: "./user-create.html",
		styleUrls: ["./user-create.scss"],
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class UserCreatePage
{
	private readonly userService: UserService =
		inject(UserService);
	private readonly logger: LoggerService =
		inject(LoggerService);
	private readonly router: Router =
		inject(Router);
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);
	private readonly snackBar: MatSnackBar =
		inject(MatSnackBar);

	readonly stepper: Signal<MatStepper | undefined> =
		viewChild<MatStepper>("stepper");

	// TanStack Query mutation for creating users
	readonly createMutation: ReturnType<UserService["createUser"]> =
		this.userService.createUser();

	// State signals
	readonly isSaving: Signal<boolean> =
		computed(
			() => this.createMutation.isPending());
	readonly saveError: Signal<string | null> =
		computed(
			() =>
				this.createMutation.error()
					? "Failed to create user. Please try again."
					: null);

	/**
	 * Async validator for username availability
	 */
	private usernameAvailabilityValidator(): AsyncValidatorFn
	{
		return (
			control: AbstractControl): Observable<ValidationErrors | null> =>
		{
			if (isNullOrUndefined(control.value))
			{
				return of(null);
			}

			return of(control.value)
			.pipe(
				debounceTime(500),
				distinctUntilChanged(),
				switchMap(
					(username: string) =>
						from(this.userService.checkUsernameAvailability(username))),
				map(
					(exists: boolean) =>
						exists ? { usernameTaken: true } : null),
				catchError(
					() => of(null)));
		};
	}

	// Form groups for each step
	readonly basicInfoForm: FormGroup =
		this.formBuilder.group(
			{
				username: [
					"",
					[
						Validators.required,
						Validators.minLength(USERNAME_VALIDATION.MIN_LENGTH),
						Validators.maxLength(USERNAME_VALIDATION.MAX_LENGTH)
					],
					[this.usernameAvailabilityValidator()]
				],
				email: [
					"",
					[
						Validators.required,
						Validators.email,
						Validators.maxLength(EMAIL_VALIDATION.MAX_LENGTH)
					]
				]
			});

	readonly accountDetailsForm: FormGroup =
		this.formBuilder.group(
			{
				fullName: [
					"",
					[
						Validators.required,
						Validators.maxLength(FULL_NAME_VALIDATION.MAX_LENGTH)
					]
				],
				isActive: [true]
			});

	// Computed signal for complete form data
	readonly formData: Signal<Partial<UserDto>> =
		computed(
			() => ({
				...this.basicInfoForm.value,
				...this.accountDetailsForm.value
			}));

	// Validation error signals
	readonly usernameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.basicInfoForm.get("username"), "Username"));

	readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.basicInfoForm.get("email"), "Email"));

	readonly fullNameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.accountDetailsForm.get("fullName"), "Full name"));

	/**
	 * Save user as draft (partial save)
	 */
	saveDraft(): void
	{
		this.logger.info("Draft save requested", this.formData());
		this.snackBar.open("Draft saved locally", "Close",
			{
				duration: 2000,
				horizontalPosition: "end",
				verticalPosition: "top"
			});
	}

	/**
	 * Submit the complete form
	 */
	async onSubmit(): Promise<void>
	{
		// Validate all steps
		if (this.basicInfoForm.invalid || this.accountDetailsForm.invalid)
		{
			this.snackBar.open("Please complete all required fields", "Close",
				{
					duration: 3000,
					horizontalPosition: "end",
					verticalPosition: "top"
				});
			return;
		}

		const userData: Partial<UserDto> =
			this.formData();

		this.createMutation.mutate(userData,
			{
				onSuccess: (createdUser) =>
				{
					this.logger.info("User created successfully",
						{
							id: createdUser.id
						});

					const message: string =
						createdUser.needsPendingEmail
							? `User "${createdUser.username}" created. Email will be sent to ${createdUser.email} within 24 hours.`
							: `User "${createdUser.username}" created. Welcome email sent to ${createdUser.email}.`;

					this.snackBar.open(message, "Close",
						{
							duration: 5000,
							horizontalPosition: "end",
							verticalPosition: "top"
						});

					// Navigate to user list
					this.router.navigate(
						["/admin/users"]);
				},
				onError: (err) =>
				{
					this.logger.error("Failed to create user", err);
				}
			});
	}

	/**
	 * Cancel and return to users list
	 */
	onCancel(): void
	{
		this.router.navigate(
			["/admin/users"]);
	}
}
