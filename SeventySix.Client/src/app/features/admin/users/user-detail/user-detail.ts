import { UpdateUserRequest, UserDto } from "@admin/users/models";
import { UserService } from "@admin/users/services";
import { DatePipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	Signal
} from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { LoggerService } from "@infrastructure/services";
import {
	EMAIL_VALIDATION,
	FULL_NAME_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants/validation.constants";
import { FORM_MATERIAL_MODULES } from "@shared/material-bundles";
import { getValidationError } from "@shared/utilities";

/**
 * User detail/edit page component.
 * Displays a single user in form controls for editing.
 * Navigated to via /users/:id route.
 * Implements reactive forms with validation following Angular best practices.
 */
@Component({
	selector: "app-user-detail-page",
	imports: [
		ReactiveFormsModule,
		DatePipe,
		MatSnackBarModule,
		MatExpansionModule,
		MatChipsModule,
		...FORM_MATERIAL_MODULES
	],
	templateUrl: "./user-detail.html",
	styleUrl: "./user-detail.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailPage
{
	private readonly userService: UserService =
		inject(UserService);
	private readonly logger: LoggerService =
		inject(LoggerService);
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);
	private readonly router: Router =
		inject(Router);
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);
	private readonly snackBar: MatSnackBar =
		inject(MatSnackBar);

	// Get user ID from route
	private readonly userId: string =
		this.route.snapshot.paramMap.get("id") || "";

	// TanStack Query for loading user data
	readonly userQuery: ReturnType<UserService["getUserById"]> =
		this.userService.getUserById(this.userId);

	// TanStack Query mutation for updating user
	readonly updateMutation: ReturnType<UserService["updateUser"]> =
		this.userService.updateUser();

	// Role management queries and mutations
	readonly rolesQuery: ReturnType<UserService["getUserRoles"]> =
		this.userService.getUserRoles(this.userId);
	readonly addRoleMutation: ReturnType<UserService["addRole"]> =
		this.userService.addRole();
	readonly removeRoleMutation: ReturnType<UserService["removeRole"]> =
		this.userService.removeRole();

	// Available roles constant (matches backend ValidRoleNames)
	readonly availableRoles: readonly string[] =
		["Developer", "Admin"];

	// Computed signals for derived state
	readonly user: Signal<UserDto | null> =
		computed(
		() => this.userQuery.data() ?? null);
	readonly isLoading: Signal<boolean> =
		computed(() => this.userQuery.isLoading());
	readonly isSaving: Signal<boolean> =
		computed(() => this.updateMutation.isPending());
	readonly error: Signal<string | null> =
		computed(() =>
			this.userQuery.error() ? "Failed to load user. Please try again." : null);
	readonly saveError: Signal<string | null> =
		computed(() =>
			this.updateMutation.error()
				? "Failed to save user. Please try again."
				: null);

	// Role computed signals
	readonly userRoles: Signal<string[]> =
		computed(
		() => this.rolesQuery.data() ?? []);
	readonly availableRolesToAdd: Signal<string[]> =
		computed(() =>
	{
		const currentRoles: string[] =
			this.userRoles();
		return this.availableRoles.filter(
			(role: string) =>
				!currentRoles.includes(role));
	});
	readonly isRoleMutating: Signal<boolean> =
		computed(
		() =>
			this.addRoleMutation.isPending()
				|| this.removeRoleMutation.isPending());

	// Computed signals
	readonly pageTitle: Signal<string> =
		computed(() =>
	{
		const currentUser: UserDto | null =
			this.user();
		return currentUser ? `Edit User: ${currentUser.username}` : "Edit User";
	});

	readonly hasUnsavedChanges: Signal<boolean> =
		computed(
		() => this.userForm.dirty);

	// Reactive form
	readonly userForm: FormGroup =
		this.formBuilder.group({
		username: [
			"",
			[
				Validators.required,
				Validators.minLength(USERNAME_VALIDATION.MIN_LENGTH),
				Validators.maxLength(USERNAME_VALIDATION.MAX_LENGTH)
			]
		],
		email: [
			"",
			[
				Validators.required,
				Validators.email,
				Validators.maxLength(EMAIL_VALIDATION.MAX_LENGTH)
			]
		],
		fullName: ["", [Validators.maxLength(FULL_NAME_VALIDATION.MAX_LENGTH)]],
		isActive: [true]
	});

	// Validation error signals
	readonly usernameError: Signal<string | null> =
		computed(() =>
			getValidationError(this.userForm.get("username"), "Username"));

	readonly emailError: Signal<string | null> =
		computed(() =>
			getValidationError(this.userForm.get("email"), "Email"));

	readonly fullNameError: Signal<string | null> =
		computed(() =>
			getValidationError(this.userForm.get("fullName"), "Full name"));

	constructor()
	{
		// Populate form when user data loads
		effect(() =>
		{
			const currentUser: UserDto | null =
				this.user();
			if (currentUser && this.userForm.pristine)
			{
				this.populateForm(currentUser);
			}
		});

		// Log errors when loading user fails
		effect(() =>
		{
			const error: Error | null =
				this.userQuery.error();
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
	private populateForm(user: UserDto): void
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
		if (!this.validateFormAndMarkTouched()) return;

		const updateRequest: UpdateUserRequest | null =
			this.buildUpdateRequest();
		if (!updateRequest) return;

		this.executeMutation(updateRequest);
	}

	/**
	 * Validates form and marks fields as touched if invalid.
	 * @returns true if form is valid, false otherwise
	 */
	private validateFormAndMarkTouched(): boolean
	{
		if (this.userForm.invalid)
		{
			this.userForm.markAllAsTouched();
			return false;
		}
		return true;
	}

	/**
	 * Builds the update request from form data and validates prerequisites.
	 * @returns UpdateUserRequest if valid, null if validation fails
	 */
	private buildUpdateRequest(): UpdateUserRequest | null
	{
		const userId: string =
			this.userId;
		if (!userId)
		{
			this.showErrorSnackBar("Invalid user ID");
			return null;
		}

		const currentUser: UserDto | null =
			this.user();
		if (!currentUser)
		{
			this.showErrorSnackBar("User data not loaded");
			return null;
		}

		return {
			id: parseInt(userId),
			username: this.userForm.value.username,
			email: this.userForm.value.email,
			fullName: this.userForm.value.fullName || undefined,
			isActive: this.userForm.value.isActive
		};
	}

	/**
	 * Executes the user update mutation with success and error handling.
	 * @param updateRequest The update request to execute
	 */
	private executeMutation(updateRequest: UpdateUserRequest): void
	{
		this.updateMutation.mutate(
			{ userId: this.userId, user: updateRequest },
			{
				onSuccess: () => this.handleMutationSuccess(),
				onError: (error: unknown) =>
					this.handleMutationError(error)
			});
	}

	/**
	 * Handles successful user update.
	 */
	private handleMutationSuccess(): void
	{
		this.userForm.markAsPristine();
		this.showSuccessSnackBar("User updated successfully");
	}

	/**
	 * Handles user update errors with appropriate messaging.
	 * @param error The error from the mutation
	 */
	private handleMutationError(error: unknown): void
	{
		const errorWithStatus: { status?: number; } =
			error as { status?: number; };

		if (errorWithStatus.status === 409)
		{
			this.handleConcurrencyError();
		}
		else
		{
			this.logger.error(
				"Failed to save user",
				error instanceof Error ? error : undefined);
			this.showErrorSnackBar("Failed to save user");
		}
	}

	/**
	 * Handles 409 conflict errors (concurrency issues).
	 */
	private handleConcurrencyError(): void
	{
		this
			.snackBar
			.open(
				"User was modified by another user. Please refresh and try again.",
				"REFRESH",
				{
					duration: 10000,
					horizontalPosition: "end",
					verticalPosition: "top"
				})
			.onAction()
			.subscribe(() => this.userQuery.refetch());
	}

	/**
	 * Shows a success snack bar message.
	 * @param message The message to display
	 */
	private showSuccessSnackBar(message: string): void
	{
		this.snackBar.open(message, "Close", {
			duration: 3000,
			horizontalPosition: "end",
			verticalPosition: "top"
		});
	}

	/**
	 * Shows an error snack bar message.
	 * @param message The message to display
	 */
	private showErrorSnackBar(message: string): void
	{
		this.snackBar.open(message, "Close", {
			duration: 3000,
			horizontalPosition: "end",
			verticalPosition: "top"
		});
	}

	/**
	 * Handles cancel action.
	 * Navigates back to users list.
	 */
	onCancel(): void
	{
		this.router.navigate(["/admin/users"]);
	}

	/**
	 * Adds a role to the user.
	 * @param role The role to add
	 */
	onAddRole(role: string): void
	{
		const userIdNum: number =
			parseInt(this.userId);
		if (isNaN(userIdNum))
		{
			return;
		}

		this.addRoleMutation.mutate(
			{ userId: userIdNum, roleName: role },
			{
				onSuccess: () =>
					this.showSuccessSnackBar(`Role "${role}" added`),
				onError: () =>
					this.showErrorSnackBar(`Failed to add role "${role}"`)
			});
	}

	/**
	 * Removes a role from the user.
	 * @param role The role to remove
	 */
	onRemoveRole(role: string): void
	{
		const userIdNum: number =
			parseInt(this.userId);
		if (isNaN(userIdNum))
		{
			return;
		}

		this.removeRoleMutation.mutate(
			{ userId: userIdNum, roleName: role },
			{
				onSuccess: () =>
					this.showSuccessSnackBar(`Role "${role}" removed`),
				onError: () =>
					this.showErrorSnackBar(`Failed to remove role "${role}"`)
			});
	}
}
