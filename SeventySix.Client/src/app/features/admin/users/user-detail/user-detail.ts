import {
	Component,
	computed,
	inject,
	ChangeDetectionStrategy,
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
import { MatExpansionModule } from "@angular/material/expansion";
import { MatChipsModule } from "@angular/material/chips";
import { UserService } from "@admin/users/services";
import { LoggerService } from "@infrastructure/services";
import { User, UpdateUserRequest } from "@admin/users/models";
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
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatIconModule,
		MatCheckboxModule,
		MatSnackBarModule,
		MatExpansionModule,
		MatChipsModule
	],
	templateUrl: "./user-detail.html",
	styleUrl: "./user-detail.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailPage
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

	// Role management queries and mutations
	readonly rolesQuery: ReturnType<UserService["getUserRoles"]> =
		this.userService.getUserRoles(this.userId);
	readonly addRoleMutation: ReturnType<UserService["addRole"]> =
		this.userService.addRole();
	readonly removeRoleMutation: ReturnType<UserService["removeRole"]> =
		this.userService.removeRole();

	// Available roles constant (matches backend ValidRoleNames)
	readonly availableRoles: readonly string[] = ["Developer", "Admin"];

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

	// Role computed signals
	readonly userRoles: Signal<string[]> = computed(
		() => this.rolesQuery.data() ?? []
	);
	readonly availableRolesToAdd: Signal<string[]> = computed(() =>
	{
		const currentRoles: string[] = this.userRoles();
		return this.availableRoles.filter(
			(role: string) => !currentRoles.includes(role)
		);
	});
	readonly isRoleMutating: Signal<boolean> = computed(
		() =>
			this.addRoleMutation.isPending() ||
			this.removeRoleMutation.isPending()
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

	constructor()
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

		const currentUser: User | null = this.user();
		if (!currentUser)
		{
			this.snackBar.open("User data not loaded", "Close", {
				duration: 3000,
				horizontalPosition: "end",
				verticalPosition: "top"
			});
			return;
		}

		const updateRequest: UpdateUserRequest = {
			id: parseInt(userId),
			username: this.userForm.value.username,
			email: this.userForm.value.email,
			fullName: this.userForm.value.fullName || undefined,
			isActive: this.userForm.value.isActive
		};

		this.updateMutation.mutate(
			{ id: userId, user: updateRequest },
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
				onError: (err: unknown) =>
				{
					// Handle 409 Conflict (concurrency error)
					if ((err as { status?: number }).status === 409)
					{
						this.snackBar
							.open(
								"User was modified by another user. Please refresh and try again.",
								"REFRESH",
								{
									duration: 10000,
									horizontalPosition: "end",
									verticalPosition: "top"
								}
							)
							.onAction()
							.subscribe(() =>
							{
								this.userQuery.refetch();
							});
					}
					else
					{
						this.logger.error(
							"Failed to save user",
							err instanceof Error ? err : undefined
						);
						this.snackBar.open("Failed to save user", "Close", {
							duration: 3000,
							horizontalPosition: "end",
							verticalPosition: "top"
						});
					}
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
		this.router.navigate(["/admin/users"]);
	}

	/**
	 * Gets validation error message for a form field.
	 */
	protected getFieldError(
		fieldName: string,
		fieldLabel: string
	): string | null
	{
		return getValidationError(this.userForm.get(fieldName), fieldLabel);
	}

	/**
	 * Adds a role to the user.
	 * @param role The role to add
	 */
	onAddRole(role: string): void
	{
		const userIdNum: number = parseInt(this.userId);
		if (isNaN(userIdNum))
		{
			return;
		}

		this.addRoleMutation.mutate(
			{ userId: userIdNum, role },
			{
				onSuccess: () =>
				{
					this.snackBar.open(`Role "${role}" added`, "Close", {
						duration: 3000,
						horizontalPosition: "end",
						verticalPosition: "top"
					});
				},
				onError: () =>
				{
					this.snackBar.open(
						`Failed to add role "${role}"`,
						"Close",
						{
							duration: 3000,
							horizontalPosition: "end",
							verticalPosition: "top"
						}
					);
				}
			}
		);
	}

	/**
	 * Removes a role from the user.
	 * @param role The role to remove
	 */
	onRemoveRole(role: string): void
	{
		const userIdNum: number = parseInt(this.userId);
		if (isNaN(userIdNum))
		{
			return;
		}

		this.removeRoleMutation.mutate(
			{ userId: userIdNum, role },
			{
				onSuccess: () =>
				{
					this.snackBar.open(`Role "${role}" removed`, "Close", {
						duration: 3000,
						horizontalPosition: "end",
						verticalPosition: "top"
					});
				},
				onError: () =>
				{
					this.snackBar.open(
						`Failed to remove role "${role}"`,
						"Close",
						{
							duration: 3000,
							horizontalPosition: "end",
							verticalPosition: "top"
						}
					);
				}
			}
		);
	}
}
