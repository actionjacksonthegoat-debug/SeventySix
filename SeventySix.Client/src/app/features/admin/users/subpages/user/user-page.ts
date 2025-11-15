import {
	Component,
	computed,
	inject,
	ChangeDetectionStrategy,
	OnInit,
	effect,
	Signal
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { UserService } from "@admin/users/services";
import { LoggerService } from "@core/services";
import { User } from "@admin/users/models";

/**
 * User detail/edit page component.
 * Displays a single user in form controls for editing.
 * Navigated to via /users/:id route.
 * Implements reactive forms with validation following Angular best practices.
 */
@Component({
	selector: "app-user-page",
	imports: [
		ReactiveFormsModule,
		DatePipe,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatIconModule,
		MatCheckboxModule,
		MatSnackBarModule
	],
	templateUrl: "./user-page.html",
	styleUrls: ["./user-page.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPage implements OnInit
{
	private readonly userService: UserService = inject(UserService);
	private readonly logger: LoggerService = inject(LoggerService);
	private readonly route: ActivatedRoute = inject(ActivatedRoute);
	private readonly router: Router = inject(Router);
	private readonly fb: FormBuilder = inject(FormBuilder);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	// Get user ID from route
	private readonly userId: string =
		this.route.snapshot.paramMap.get("id") || "";

	// TanStack Query for loading user data
	readonly userQuery: ReturnType<UserService["getUserById"]> =
		this.userService.getUserById(this.userId);

	// TanStack Query mutation for updating user
	readonly updateMutation: ReturnType<UserService["updateUser"]> =
		this.userService.updateUser();

	// Computed signals for derived state
	readonly user: Signal<User | null> = computed(
		() => this.userQuery.data() ?? null
	);
	readonly isLoading: Signal<boolean> = computed(() =>
		this.userQuery.isLoading()
	);
	readonly isSaving: Signal<boolean> = computed(() =>
		this.updateMutation.isPending()
	);
	readonly error: Signal<string | null> = computed(() =>
		this.userQuery.error() ? "Failed to load user. Please try again." : null
	);
	readonly saveError: Signal<string | null> = computed(() =>
		this.updateMutation.error()
			? "Failed to save user. Please try again."
			: null
	);

	// Computed signals
	readonly pageTitle: Signal<string> = computed(() =>
	{
		const currentUser: User | null = this.user();
		return currentUser ? `Edit User: ${currentUser.username}` : "Edit User";
	});

	readonly hasUnsavedChanges: Signal<boolean> = computed(
		() => this.userForm.dirty
	);

	// Reactive form
	readonly userForm: FormGroup = this.fb.group({
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
		],
		fullName: ["", [Validators.maxLength(100)]],
		isActive: [true]
	});

	/**
	 * Initializes the user page.
	 * Loads user data from route parameter and populates form when available.
	 */
	ngOnInit(): void
	{
		// Populate form when user data loads
		effect(() =>
		{
			const currentUser: User | null = this.user();
			if (currentUser && this.userForm.pristine)
			{
				this.populateForm(currentUser);
			}
		});

		// Log errors when loading user fails
		effect(() =>
		{
			const error: Error | null = this.userQuery.error();
			if (error)
			{
				this.logger.error("Failed to load user", error);
			}
		});
	}

	/**
	 * Populates the form with user data.
	 * @param user The user data to populate
	 */
	private populateForm(user: User): void
	{
		this.userForm.patchValue({
			username: user.username,
			email: user.email,
			fullName: user.fullName || "",
			isActive: user.isActive
		});

		// Mark as pristine after initial load
		this.userForm.markAsPristine();
	}

	/**
	 * Handles form submission.
	 * Validates and saves user changes.
	 */
	async onSubmit(): Promise<void>
	{
		// Validate form
		if (this.userForm.invalid)
		{
			this.userForm.markAllAsTouched();
			this.logger.info("Form validation failed");
			return;
		}

		const userId: string = this.userId;
		if (!userId)
		{
			this.snackBar.open("Invalid user ID", "Close", {
				duration: 3000,
				horizontalPosition: "end",
				verticalPosition: "top"
			});
			return;
		}

		const formValue: Partial<User> = this.userForm.value;

		this.updateMutation.mutate(
			{ id: userId, user: formValue },
			{
				onSuccess: () =>
				{
					this.userForm.markAsPristine();
					this.logger.info("User updated successfully", {
						id: userId
					});

					// Show success notification
					this.snackBar.open("User updated successfully", "Close", {
						duration: 3000,
						horizontalPosition: "end",
						verticalPosition: "top"
					});
				},
				onError: (err) =>
				{
					this.logger.error("Failed to save user", err);
				}
			}
		);
	}

	/**
	 * Handles cancel action.
	 * Navigates back to users list.
	 */
	onCancel(): void
	{
		this.router.navigate(["/users"]);
	}

	/**
	 * Gets error message for a form field.
	 * @param fieldName The form field name
	 * @returns Error message or null
	 */
	getFieldError(fieldName: string): string | null
	{
		const control: import("@angular/forms").AbstractControl | null =
			this.userForm.get(fieldName);

		if (!control || !control.touched || !control.errors)
		{
			return null;
		}

		if (control.errors["required"])
		{
			return `${this.getFieldLabel(fieldName)} is required`;
		}

		if (control.errors["email"])
		{
			return "Invalid email format";
		}

		if (control.errors["minlength"])
		{
			const minLength: number =
				control.errors["minlength"].requiredLength;
			return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
		}

		if (control.errors["maxlength"])
		{
			const maxLength: number =
				control.errors["maxlength"].requiredLength;
			return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
		}

		return "Invalid value";
	}

	/**
	 * Gets display label for a field.
	 * @param fieldName The form field name
	 * @returns Display label
	 */
	private getFieldLabel(fieldName: string): string
	{
		const labels: Record<string, string> = {
			username: "Username",
			email: "Email",
			fullName: "Full Name",
			isActive: "Active Status"
		};
		return labels[fieldName] || fieldName;
	}

	/**
	 * Checks if a field has an error and has been touched.
	 * @param fieldName The form field name
	 * @returns True if field has error
	 */
	hasFieldError(fieldName: string): boolean
	{
		const control: import("@angular/forms").AbstractControl | null =
			this.userForm.get(fieldName);
		return !!(control && control.invalid && control.touched);
	}
}
