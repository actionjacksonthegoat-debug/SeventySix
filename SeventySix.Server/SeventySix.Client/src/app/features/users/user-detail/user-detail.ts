import {
	Component,
	inject,
	signal,
	computed,
	ChangeDetectionStrategy,
	OnInit,
	effect
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UserService } from "@core/services/user.service";
import { User } from "@core/models/interfaces/user";
import { LoggerService } from "@core/services/logger.service";
import { NotificationService } from "@core/services/notification.service";

/**
 * User detail component.
 * Displays and edits a single user's information using reactive forms.
 * Can be navigated to directly via /users/:id.
 * Follows OnPush change detection for performance.
 */
@Component({
	selector: "app-user-detail",
	imports: [ReactiveFormsModule],
	templateUrl: "./user-detail.html",
	styleUrls: ["./user-detail.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetail implements OnInit
{
	private readonly userService = inject(UserService);
	private readonly logger = inject(LoggerService);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	private readonly fb = inject(FormBuilder);
	private readonly notificationService = inject(NotificationService);

	// State signals
	readonly user = signal<User | null>(null);
	readonly isLoading = signal<boolean>(true);
	readonly isSaving = signal<boolean>(false);
	readonly error = signal<string | null>(null);

	// Computed signals
	readonly hasUser = computed(() => this.user() !== null);
	readonly canSave = computed(
		() => this.userForm.valid && this.userForm.dirty && !this.isSaving()
	);

	// Reactive form
	readonly userForm: FormGroup;

	constructor()
	{
		// Initialize form with validation
		this.userForm = this.fb.group({
			username: [
				"",
				[
					Validators.required,
					Validators.minLength(3),
					Validators.maxLength(50),
					Validators.pattern(/^[a-zA-Z0-9_]+$/)
				]
			],
			email: [
				"",
				[
					Validators.required,
					Validators.email,
					Validators.maxLength(255)
				]
			],
			fullName: [
				"",
				[Validators.maxLength(100)]
			],
			isActive: [true]
		});

		// Sync form with user data when user changes
		effect(() =>
		{
			const currentUser = this.user();
			if (currentUser)
			{
				this.userForm.patchValue({
					username: currentUser.username,
					email: currentUser.email,
					fullName: currentUser.fullName || "",
					isActive: currentUser.isActive
				}, { emitEvent: false });
				this.userForm.markAsPristine();
			}
		});
	}

	ngOnInit(): void
	{
		// Get user ID from route params
		const id = this.route.snapshot.paramMap.get("id");
		if (id)
		{
			this.loadUser(+id);
		}
		else
		{
			this.error.set("No user ID provided");
			this.isLoading.set(false);
		}
	}

	/**
	 * Load user data from service
	 */
	private loadUser(id: number): void
	{
		this.isLoading.set(true);
		this.error.set(null);

		this.userService.getUserById(id).subscribe({
			next: (data) =>
			{
				this.user.set(data);
				this.isLoading.set(false);
				this.logger.info("User loaded successfully", { id });
			},
			error: (err) =>
			{
				this.error.set(
					"Failed to load user. Please try again."
				);
				this.isLoading.set(false);
				this.logger.error("Failed to load user", err);
			}
		});
	}

	/**
	 * Save user changes
	 */
	save(): void
	{
		if (!this.userForm.valid || !this.user())
		{
			return;
		}

		this.isSaving.set(true);
		const userId = this.user()!.id;
		const formValue = this.userForm.value;

		this.userService.updateUser(userId, formValue).subscribe({
			next: (updatedUser) =>
			{
				this.user.set(updatedUser);
				this.isSaving.set(false);
				this.userForm.markAsPristine();
				this.notificationService.success("User updated successfully");
				this.logger.info("User updated successfully", { id: userId });
			},
			error: (err) =>
			{
				this.isSaving.set(false);
				this.notificationService.error("Failed to update user");
				this.logger.error("Failed to update user", err);
			}
		});
	}

	/**
	 * Cancel editing and navigate back to user list
	 */
	cancel(): void
	{
		if (this.userForm.dirty)
		{
			const confirmDiscard = confirm(
				"You have unsaved changes. Are you sure you want to discard them?"
			);
			if (!confirmDiscard)
			{
				return;
			}
		}
		this.router.navigate(["/users"]);
	}

	/**
	 * Reset form to original user data
	 */
	reset(): void
	{
		const currentUser = this.user();
		if (currentUser)
		{
			this.userForm.patchValue({
				username: currentUser.username,
				email: currentUser.email,
				fullName: currentUser.fullName || "",
				isActive: currentUser.isActive
			});
			this.userForm.markAsPristine();
		}
	}

	/**
	 * Get form control error message
	 */
	getErrorMessage(controlName: string): string
	{
		const control = this.userForm.get(controlName);
		if (!control || !control.errors || !control.touched)
		{
			return "";
		}

		if (control.errors["required"])
		{
			return `${controlName} is required`;
		}
		if (control.errors["minlength"])
		{
			return `${controlName} must be at least ${control.errors["minlength"].requiredLength} characters`;
		}
		if (control.errors["maxlength"])
		{
			return `${controlName} must not exceed ${control.errors["maxlength"].requiredLength} characters`;
		}
		if (control.errors["email"])
		{
			return "Invalid email format";
		}
		if (control.errors["pattern"])
		{
			return `${controlName} must contain only alphanumeric characters and underscores`;
		}

		return "Invalid value";
	}
}
