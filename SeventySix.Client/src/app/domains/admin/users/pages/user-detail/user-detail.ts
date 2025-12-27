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
import { toSignal } from "@angular/core/rxjs-interop";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatExpansionModule } from "@angular/material/expansion";
import { ActivatedRoute, Router } from "@angular/router";
import {
	HTTP_STATUS,
	REQUESTABLE_ROLES,
	SKELETON_CHECKBOX,
	SKELETON_INPUT,
	SKELETON_TEXT_SHORT,
	SkeletonTheme
} from "@shared/constants";
import {
	FULL_NAME_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants/validation.constants";
import { FORM_MATERIAL_MODULES } from "@shared/material-bundles";
import { LoggerService, NotificationService } from "@shared/services";
import { getValidationError } from "@shared/utilities";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";
import { map } from "rxjs";

/**
 * User detail/edit page component.
 * Displays a single user in form controls for editing.
 * Navigated to via /users/:id route.
 * Implements reactive forms with validation following Angular best practices.
 */
@Component(
	{
		selector: "app-user-detail-page",
		imports: [
			ReactiveFormsModule,
			DatePipe,
			MatExpansionModule,
			MatChipsModule,
			NgxSkeletonLoaderModule,
			...FORM_MATERIAL_MODULES
		],
		templateUrl: "./user-detail.html",
		styleUrl: "./user-detail.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class UserDetailPage
{
	/**
	 * Service that provides user-related queries and mutations.
	 * @type {UserService}
	 * @private
	 * @readonly
	 */
	private readonly userService: UserService =
		inject(UserService);

	/**
	 * Logger for diagnostic messages.
	 * @type {LoggerService}
	 * @private
	 * @readonly
	 */
	private readonly logger: LoggerService =
		inject(LoggerService);

	/**
	 * Activated route used to obtain route parameters such as user ID.
	 * @type {ActivatedRoute}
	 * @private
	 * @readonly
	 */
	private readonly route: ActivatedRoute =
		inject(ActivatedRoute);

	/**
	 * Angular router used for navigation (cancel/back actions).
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Form builder used to construct the reactive user form.
	 * @type {FormBuilder}
	 * @private
	 * @readonly
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Notification service for user-facing messages.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * User ID extracted from the route parameters.
	 * @type {string}
	 * @private
	 */
	private readonly userId: string =
		this.route.snapshot.paramMap.get("id") || "";

	/**
	 * TanStack Query used to load the user by ID.
	 * @type {ReturnType<typeof this.userService.getUserById>}
	 */
	readonly userQuery: ReturnType<typeof this.userService.getUserById> =
		this.userService.getUserById(this.userId);

	/**
	 * Mutation used to persist user updates.
	 * @type {ReturnType<typeof this.userService.updateUser>}
	 */
	readonly updateMutation: ReturnType<typeof this.userService.updateUser> =
		this.userService.updateUser();

	/**
	 * Role management queries and mutations for the current user.
	 * @type {ReturnType<typeof this.userService.getUserRoles>}
	 */
	readonly rolesQuery: ReturnType<typeof this.userService.getUserRoles> =
		this.userService.getUserRoles(this.userId);
	/**
	 * Mutation for adding a role to the user.
	 * @type {ReturnType<typeof this.userService.addRole>}
	 */
	readonly addRoleMutation: ReturnType<typeof this.userService.addRole> =
		this.userService.addRole();
	/**
	 * Mutation for removing a role from the user.
	 * @type {ReturnType<typeof this.userService.removeRole>}
	 */
	readonly removeRoleMutation: ReturnType<typeof this.userService.removeRole> =
		this.userService.removeRole();

	// Available roles constant (matches backend ValidRoleNames)
	readonly availableRoles: readonly string[] =
		REQUESTABLE_ROLES;

	// Skeleton theme constants
	/**
	 * Skeleton theme for input placeholders.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonInput: SkeletonTheme =
		SKELETON_INPUT;

	/**
	 * Skeleton theme for checkbox placeholders.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonCheckbox: SkeletonTheme =
		SKELETON_CHECKBOX;

	/**
	 * Skeleton theme for short text placeholders.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonTextShort: SkeletonTheme =
		SKELETON_TEXT_SHORT;

	// Computed signals for derived state
	/**
	 * Currently loaded user or null when not available.
	 * @type {Signal<UserDto | null>}
	 */
	readonly user: Signal<UserDto | null> =
		computed(
			() => this.userQuery.data() ?? null);

	/**
	 * Loading indicator for the user query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.userQuery.isLoading());

	/**
	 * Saving indicator for update mutations.
	 * @type {Signal<boolean>}
	 */
	readonly isSaving: Signal<boolean> =
		computed(
			() => this.updateMutation.isPending());

	/**
	 * Error message when loading the user fails.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			() =>
				this.userQuery.error() ? "Failed to load user. Please try again." : null);

	/**
	 * Error message when saving the user fails.
	 * @type {Signal<string | null>}
	 */
	readonly saveError: Signal<string | null> =
		computed(
			() =>
				this.updateMutation.error()
					? "Failed to save user. Please try again."
					: null);

	// Role computed signals
	/**
	 * Roles currently assigned to the user.
	 * @type {Signal<string[]>}
	 */
	readonly userRoles: Signal<string[]> =
		computed(
			() => this.rolesQuery.data() ?? []);

	/**
	 * Roles that can be added to the user (not currently assigned).
	 * @type {Signal<string[]>}
	 */
	readonly availableRolesToAdd: Signal<string[]> =
		computed(
			() =>
			{
				const currentRoles: string[] =
					this.userRoles();
				return this.availableRoles.filter(
					(role: string) =>
						!currentRoles.includes(role));
			});

	/**
	 * True when a role add/remove operation is in progress.
	 * @type {Signal<boolean>}
	 */
	readonly isRoleMutating: Signal<boolean> =
		computed(
			() =>
				this.addRoleMutation.isPending()
					|| this.removeRoleMutation.isPending());

	// Computed signals
	/**
	 * Page title derived from the loaded user.
	 * @type {Signal<string>}
	 */
	readonly pageTitle: Signal<string> =
		computed(
			() =>
			{
				const currentUser: UserDto | null =
					this.user();
				return currentUser ? `Edit User: ${currentUser.username}` : "Edit User";
			});

	// Reactive form
	/**
	 * Reactive form group for editing a user.
	 * @type {FormGroup}
	 */
	readonly userForm: FormGroup =
		this.formBuilder.group(
			{
				username: [
					"",
					[
						Validators.required,
						Validators.minLength(USERNAME_VALIDATION.MIN_LENGTH),
						Validators.maxLength(USERNAME_VALIDATION.MAX_LENGTH)
					]
				],
				email: ["", [Validators.required, Validators.email]],
				fullName: ["", [Validators.maxLength(FULL_NAME_VALIDATION.MAX_LENGTH)]],
				isActive: [true]
			});

	/**
	 * True when the form has unsaved changes (dirty state).
	 * @type {Signal<boolean>}
	 */
	readonly hasUnsavedChanges: Signal<boolean> =
		toSignal(
			this.userForm.statusChanges.pipe(
				map(
					() => this.userForm.dirty)),
			{ initialValue: false });

	// Validation error signals
	/**
	 * Username validation error (for display next to field).
	 * @type {Signal<string | null>}
	 */
	readonly usernameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.userForm.get("username"), "Username"));

	/**
	 * Email validation error (for display next to field).
	 * @type {Signal<string | null>}
	 */
	readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.userForm.get("email"), "Email"));

	/**
	 * Full name validation error (for display next to field).
	 * @type {Signal<string | null>}
	 */
	readonly fullNameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.userForm.get("fullName"), "Full name"));

	constructor()
	{
		// Populate form when user data loads
		effect(
			() =>
			{
				const currentUser: UserDto | null =
					this.user();
				if (currentUser && this.userForm.pristine)
				{
					this.populateForm(currentUser);
				}
			});

		// Log errors when loading user fails
		effect(
			() =>
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
	 * Populate the reactive form from the given user DTO and mark it pristine.
	 * @param {UserDto} user
	 * The user data to populate.
	 * @returns {void}
	 */
	private populateForm(user: UserDto): void
	{
		this.userForm.patchValue(
			{
				username: user.username,
				email: user.email,
				fullName: user.fullName || "",
				isActive: user.isActive
			});

		// Mark as pristine after initial load
		this.userForm.markAsPristine();
	}

	/**
	 * Handles form submission. Validates and saves user changes.
	 * @returns {Promise<void>}
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
	 * @returns {boolean}
	 * True if form is valid, false otherwise.
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
	 * @returns {UpdateUserRequest | null}
	 * UpdateUserRequest if valid, otherwise null.
	 */
	private buildUpdateRequest(): UpdateUserRequest | null
	{
		const userId: string =
			this.userId;
		if (!userId)
		{
			this.notificationService.error("Invalid user ID");
			return null;
		}

		const currentUser: UserDto | null =
			this.user();
		if (!currentUser)
		{
			this.notificationService.error("User data not loaded");
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
		this.notificationService.success("User updated successfully");
	}

	/**
	 * Handles user update errors with appropriate messaging.
	 * @param {unknown} error
	 * The error from the mutation.
	 * @returns {void}
	 */
	private handleMutationError(error: unknown): void
	{
		const errorWithStatus: { status?: number; } =
			error as { status?: number; };

		if (errorWithStatus.status === HTTP_STATUS.CONFLICT)
		{
			this.handleConcurrencyError();
		}
		else
		{
			this.logger.error(
				"Failed to save user",
				error instanceof Error ? error : undefined);
			this.notificationService.error("Failed to save user");
		}
	}

	/**
	 * Handles 409 conflict errors (concurrency issues).
	 */
	private handleConcurrencyError(): void
	{
		this.notificationService.warningWithAction(
			"User was modified by another user. Please refresh and try again.",
			"REFRESH",
			() => this.userQuery.refetch());
	}

	/**
	 * Handles cancel action.
	 * Navigates back to users list.
	 */
	onCancel(): void
	{
		this.router.navigate(
			["/admin/users"]);
	}

	/**
	 * Adds a role to the user.
	 * @param {string} role
	 * The role to add.
	 * @returns {void}
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
					this.notificationService.success(`Role "${role}" added`),
				onError: () =>
					this.notificationService.error(`Failed to add role "${role}"`)
			});
	}

	/**
	 * Removes a role from the user.
	 * @param {string} role
	 * The role to remove.
	 * @returns {void}
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
					this.notificationService.success(`Role "${role}" removed`),
				onError: () =>
					this.notificationService.error(`Failed to remove role "${role}"`)
			});
	}
}
