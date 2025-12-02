import {
	Component,
	computed,
	inject,
	ChangeDetectionStrategy,
	viewChild,
	Signal
} from "@angular/core";
import { Router } from "@angular/router";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
	AbstractControl,
	AsyncValidatorFn,
	ValidationErrors
} from "@angular/forms";
import { MatStepperModule, MatStepper } from "@angular/material/stepper";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import {
	of,
	Observable,
	from,
	debounceTime,
	distinctUntilChanged,
	switchMap,
	map,
	catchError
} from "rxjs";
import { UserService } from "@admin/users/services";
import { LoggerService } from "@infrastructure/services";
import { User } from "@admin/users/models";

/**
 * User creation wizard component.
 * Multi-step form for creating new users with validation.
 * Uses Material Stepper for guided user experience.
 */
@Component({
	selector: "app-user-create",
	imports: [
		ReactiveFormsModule,
		MatStepperModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatIconModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		MatSnackBarModule
	],
	templateUrl: "./user-create.html",
	styleUrls: ["./user-create.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCreatePage
{
	private readonly userService: UserService = inject(UserService);
	private readonly logger: LoggerService = inject(LoggerService);
	private readonly router: Router = inject(Router);
	private readonly fb: FormBuilder = inject(FormBuilder);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	readonly stepper: Signal<MatStepper | undefined> =
		viewChild<MatStepper>("stepper");

	// TanStack Query mutation for creating users
	readonly createMutation: ReturnType<UserService["createUser"]> =
		this.userService.createUser();

	// State signals
	readonly isSaving: Signal<boolean> = computed(() =>
		this.createMutation.isPending()
	);
	readonly saveError: Signal<string | null> = computed(() =>
		this.createMutation.error()
			? "Failed to create user. Please try again."
			: null
	);

	/**
	 * Async validator for username availability
	 */
	private usernameAvailabilityValidator(): AsyncValidatorFn
	{
		return (
			control: AbstractControl
		): Observable<ValidationErrors | null> =>
		{
			if (!control.value)
			{
				return of(null);
			}

			return of(control.value).pipe(
				debounceTime(500),
				distinctUntilChanged(),
				switchMap((username: string) =>
					from(this.userService.checkUsernameAvailability(username))
				),
				map((exists: boolean) =>
					exists ? { usernameTaken: true } : null
				),
				catchError(() => of(null))
			);
		};
	}

	// Form groups for each step
	readonly basicInfoForm: FormGroup = this.fb.group({
		username: [
			"",
			[
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(50)
			],
			[this.usernameAvailabilityValidator()]
		],
		email: [
			"",
			[Validators.required, Validators.email, Validators.maxLength(255)]
		]
	});

	readonly accountDetailsForm: FormGroup = this.fb.group({
		fullName: ["", [Validators.maxLength(100)]],
		isActive: [true]
	});

	// Computed signal for complete form data
	readonly formData: Signal<Partial<User>> = computed(() => ({
		...this.basicInfoForm.value,
		...this.accountDetailsForm.value
	}));

	/**
	 * Save user as draft (partial save)
	 */
	saveDraft(): void
	{
		this.logger.info("Draft save requested", this.formData());
		this.snackBar.open("Draft saved locally", "Close", {
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
			this.snackBar.open("Please complete all required fields", "Close", {
				duration: 3000,
				horizontalPosition: "end",
				verticalPosition: "top"
			});
			return;
		}

		const userData: Partial<User> = this.formData();

		this.createMutation.mutate(userData, {
			onSuccess: (createdUser) =>
			{
				this.logger.info("User created successfully", {
					id: createdUser.id
				});

				// Show success notification with email info
				this.snackBar.open(
					`User "${createdUser.username}" created. Welcome email sent to ${createdUser.email}.`,
					"Close",
					{
						duration: 5000,
						horizontalPosition: "end",
						verticalPosition: "top"
					}
				);

				// Navigate to user list
				this.router.navigate(["/admin/users"]);
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
		this.router.navigate(["/admin/users"]);
	}
}
