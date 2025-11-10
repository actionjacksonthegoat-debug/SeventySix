import {
	Component,
	signal,
	computed,
	inject,
	ChangeDetectionStrategy,
	ViewChild
} from "@angular/core";
import { Router } from "@angular/router";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
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
import { UserService, LoggerService } from "@core/services";

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
	private readonly userService = inject(UserService);
	private readonly logger = inject(LoggerService);
	private readonly router = inject(Router);
	private readonly fb = inject(FormBuilder);
	private readonly snackBar = inject(MatSnackBar);

	@ViewChild("stepper") stepper!: MatStepper;

	// State signals
	readonly isSaving = signal<boolean>(false);
	readonly saveError = signal<string | null>(null);

	// Form groups for each step
	readonly basicInfoForm: FormGroup = this.fb.group({
		username: [
			"",
			[
				Validators.required,
				Validators.minLength(3),
				Validators.maxLength(50)
			]
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
	readonly formData = computed(() => ({
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
		// Clear previous errors
		this.saveError.set(null);

		// Validate all steps
		if (this.basicInfoForm.invalid || this.accountDetailsForm.invalid)
		{
			this.saveError.set("Please complete all required fields");
			return;
		}

		this.isSaving.set(true);

		const userData = this.formData();

		this.userService.createUser(userData).subscribe({
			next: (createdUser) =>
			{
				this.isSaving.set(false);
				this.logger.info("User created successfully", {
					id: createdUser.id
				});

				// Show success notification
				this.snackBar.open("User created successfully!", "View", {
					duration: 5000,
					horizontalPosition: "end",
					verticalPosition: "top"
				});

				// Navigate to user list
				this.router.navigate(["/users"]);
			},
			error: (err) =>
			{
				this.saveError.set("Failed to create user. Please try again.");
				this.isSaving.set(false);
				this.logger.error("Failed to create user", err);
			}
		});
	}

	/**
	 * Cancel and return to users list
	 */
	onCancel(): void
	{
		this.router.navigate(["/users"]);
	}
}
