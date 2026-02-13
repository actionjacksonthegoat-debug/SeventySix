import { UserDto } from "@admin/users/models";
import { UserService } from "@admin/users/services";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal,
	signal,
	viewChild,
	WritableSignal
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
import { MatChipsModule } from "@angular/material/chips";
import { MatStepper } from "@angular/material/stepper";
import { Router } from "@angular/router";
import { REQUESTABLE_ROLES } from "@shared/constants/role.constants";
import { DEBOUNCE_TIME } from "@shared/constants/timing.constants";
import {
	EMAIL_VALIDATION,
	FULL_NAME_VALIDATION,
	USERNAME_VALIDATION
} from "@shared/constants/validation.constants";
import { STEPPER_MATERIAL_MODULES } from "@shared/material-bundles.constants";
import { LoggerService, NotificationService } from "@shared/services";
import { getValidationError } from "@shared/utilities";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";
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
			MatChipsModule,
			...STEPPER_MATERIAL_MODULES
		],
		templateUrl: "./user-create.html",
		styleUrls: ["./user-create.scss"],
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class UserCreatePage
{
	/**
	 * Service handling user-related queries and mutations.
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
	 * Router used to navigate after create/cancel actions.
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Form builder used to construct reactive form groups.
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
	 * Reference to the stepper component used by the multi-step form.
	 * @type {Signal<MatStepper | undefined>}
	 */
	readonly stepper: Signal<MatStepper | undefined> =
		viewChild<MatStepper>("stepper");

	/**
	 * Mutation for creating a new user record.
	 * @type {ReturnType<typeof this.userService.createUser>}
	 */
	readonly createMutation: ReturnType<typeof this.userService.createUser> =
		this.userService.createUser();

	/**
	 * Available roles that can be requested for a new user.
	 * @type {readonly string[]}
	 */
	readonly availableRoles: readonly string[] = REQUESTABLE_ROLES;

	/**
	 * Writable signal that tracks selected roles in the UI.
	 * @type {WritableSignal<string[]>}
	 * @private
	 */
	private readonly selectedRolesSignal: WritableSignal<string[]> =
		signal<string[]>([]);

	/**
	 * Readonly view of selected roles for template binding.
	 * @type {Signal<string[]>}
	 */
	readonly selectedRoles: Signal<string[]> =
		this.selectedRolesSignal.asReadonly();

	/**
	 * Set-based view of selected roles for efficient template lookups.
	 * @type {Signal<Set<string>>}
	 */
	readonly selectedRolesSet: Signal<Set<string>> =
		computed(
			(): Set<string> =>
				new Set(this.selectedRoles()));

	/**
	 * Mutation for adding a role to a user.
	 * @type {ReturnType<typeof this.userService.addRole>}
	 */
	readonly addRoleMutation: ReturnType<typeof this.userService.addRole> =
		this.userService.addRole();

	// State signals
	/**
	 * Indicates whether the create mutation is pending.
	 * @type {Signal<boolean>}
	 */
	readonly isSaving: Signal<boolean> =
		computed(
			() => this.createMutation.isPending());

	/**
	 * Error message when create operation fails.
	 * @type {Signal<string | null>}
	 */
	readonly saveError: Signal<string | null> =
		computed(
			() =>
				this.createMutation.error()
					? "Failed to create user. Please try again."
					: null);

	/**
	 * Async validator for username availability.
	 * @returns {AsyncValidatorFn}
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
					debounceTime(DEBOUNCE_TIME.INPUT_VALIDATION),
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
	/**
	 * Basic information form group (username, email) with validators.
	 * @type {FormGroup}
	 */
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

	/**
	 * Account details form (full name, isActive).
	 * @type {FormGroup}
	 */
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

	/**
	 * Returns the merged form data from all steps for review and submission.
	 *
	 * <p>This is a method (not a computed signal) because FormGroup.value is
	 * not a signal — a computed() would cache the initial empty values and
	 * never re-evaluate in Zoneless mode.</p>
	 *
	 * @returns
	 * The aggregated form data.
	 */
	formData(): Partial<UserDto>
	{
		return {
			...this.basicInfoForm.value,
			...this.accountDetailsForm.value
		};
	}

	// Validation error signals
	/**
	 * Username validation error (for display next to field).
	 * @type {Signal<string | null>}
	 */
	readonly usernameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.basicInfoForm.get("username"), "Username"));

	/**
	 * Email validation error (for display next to field).
	 * @type {Signal<string | null>}
	 */
	readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.basicInfoForm.get("email"), "Email"));

	/**
	 * Full name validation error (for display next to field).
	 * @type {Signal<string | null>}
	 */
	readonly fullNameError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.accountDetailsForm.get("fullName"), "Full name"));

	/**
	 * Submit the complete user creation form and persist to the server.
	 * Validates all steps, performs the create mutation and assigns roles on success.
	 * @returns {Promise<void>}
	 */
	async onSubmit(): Promise<void>
	{
		// Validate all steps
		if (this.basicInfoForm.invalid || this.accountDetailsForm.invalid)
		{
			this.notificationService.error("Please complete all required fields");
			return;
		}

		const userData: Partial<UserDto> =
			this.formData();

		this.createMutation.mutate(userData,
			{
				onSuccess: (createdUser) =>
				{
				// Assign selected roles to the newly created user
					this.assignRoles(createdUser.id);

					const message: string =
						`User "${createdUser.username}" created. Welcome email queued for ${createdUser.email}.`;

					this.notificationService.success(message);

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
	 * Assign selected roles to the user.
	 * @param {number} userId
	 * The ID of the newly created user.
	 * @returns {void}
	 */
	private assignRoles(userId: number): void
	{
		const rolesToAssign: string[] =
			this.selectedRoles();

		for (const roleName of rolesToAssign)
		{
			this.addRoleMutation.mutate(
				{ userId, roleName },
				{
					onError: () =>
					{
						this.notificationService.error(`Failed to assign role "${roleName}"`);
					}
				});
		}
	}

	/**
	 * Cancel creation and navigate back to the users list.
	 * @returns {void}
	 */
	onCancel(): void
	{
		this.router.navigate(
			["/admin/users"]);
	}

	/**
	 * Toggle selection state for the given role name.
	 * @param {string} roleName
	 * The role to toggle.
	 * @returns {void}
	 */
	toggleRole(roleName: string): void
	{
		const currentRoles: string[] =
			this.selectedRolesSignal();
		if (currentRoles.includes(roleName))
		{
			this.selectedRolesSignal.set(
				currentRoles.filter(
					(selectedRole: string) =>
						selectedRole !== roleName));
		}
		else
		{
			this.selectedRolesSignal.set(
				[...currentRoles, roleName]);
		}
	}
}
