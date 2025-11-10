import {
	Component,
	signal,
	computed,
	inject,
	ChangeDetectionStrategy,
	OnInit
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { UserService } from "@core/services/user.service";
import { LoggerService } from "@core/services/logger.service";
import { User } from "@core/models/interfaces/user";

/**
 * User detail/edit page component.
 * Displays a single user in form controls for editing.
 * Navigated to via /users/:id route.
 * Implements reactive forms with validation following Angular best practices.
 */
@Component({
	selector: "app-user-page",
	imports: [ReactiveFormsModule, DatePipe],
	templateUrl: "./user-page.html",
	styleUrls: ["./user-page.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPage implements OnInit
{
	private readonly userService = inject(UserService);
	private readonly logger = inject(LoggerService);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly fb = inject(FormBuilder);

	// State signals
	readonly user = signal<User | null>(null);
	readonly isLoading = signal<boolean>(true);
	readonly isSaving = signal<boolean>(false);
	readonly error = signal<string | null>(null);
	readonly saveError = signal<string | null>(null);

	// Computed signals
	readonly pageTitle = computed(() =>
	{
		const currentUser = this.user();
		return currentUser ? `Edit User: ${currentUser.username}` : "Edit User";
	});

	readonly hasUnsavedChanges = computed(() => this.userForm.dirty);

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
	 * Loads user data from route parameter.
	 */
	ngOnInit(): void
	{
		this.loadUser();
	}

	/**
	 * Loads user data based on route parameter ID.
	 */
	private loadUser(): void
	{
		const userId = this.route.snapshot.paramMap.get("id");

		if (!userId)
		{
			this.error.set("Invalid user ID");
			this.isLoading.set(false);
			this.logger.error("No user ID provided in route");
			return;
		}

		this.isLoading.set(true);
		this.error.set(null);

		this.userService.getUserById(userId).subscribe({
			next: (data) =>
			{
				this.user.set(data);
				this.populateForm(data);
				this.isLoading.set(false);
				this.logger.info("User loaded successfully", { id: userId });
			},
			error: (err) =>
			{
				this.error.set("Failed to load user. Please try again.");
				this.isLoading.set(false);
				this.logger.error("Failed to load user", err);
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
		// Clear previous save errors
		this.saveError.set(null);

		// Validate form
		if (this.userForm.invalid)
		{
			this.userForm.markAllAsTouched();
			this.logger.info("Form validation failed");
			return;
		}

		const userId = this.route.snapshot.paramMap.get("id");
		if (!userId)
		{
			this.saveError.set("Invalid user ID");
			return;
		}

		this.isSaving.set(true);

		const formValue = this.userForm.value;

		this.userService.updateUser(userId, formValue).subscribe({
			next: (updatedUser) =>
			{
				this.user.set(updatedUser);
				this.userForm.markAsPristine();
				this.isSaving.set(false);
				this.logger.info("User updated successfully", { id: userId });
			},
			error: (err) =>
			{
				this.saveError.set("Failed to save user. Please try again.");
				this.isSaving.set(false);
				this.logger.error("Failed to save user", err);
			}
		});
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
		const control = this.userForm.get(fieldName);

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
			const minLength = control.errors["minlength"].requiredLength;
			return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
		}

		if (control.errors["maxlength"])
		{
			const maxLength = control.errors["maxlength"].requiredLength;
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
		const control = this.userForm.get(fieldName);
		return !!(control && control.invalid && control.touched);
	}
}
