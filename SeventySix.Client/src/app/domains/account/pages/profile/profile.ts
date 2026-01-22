import { AvailableRoleDto, UpdateProfileRequest, UserProfileDto } from "@account/models";
import { AccountService } from "@account/services";
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
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import {
	SKELETON_BUTTON,
	SKELETON_INPUT,
	SKELETON_TEXT_MEDIUM,
	SKELETON_TEXT_SHORT,
	SkeletonTheme
} from "@shared/constants";
import {
	EMAIL_VALIDATION,
	FULL_NAME_VALIDATION
} from "@shared/constants/validation.constants";
import { NotificationService } from "@shared/services";
import { getValidationError } from "@shared/utilities";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

@Component(
	{
		selector: "app-profile-page",
		imports: [
			ReactiveFormsModule,
			DatePipe,
			MatFormFieldModule,
			MatInputModule,
			MatButtonModule,
			MatCardModule,
			MatProgressSpinnerModule,
			RouterLink,
			NgxSkeletonLoaderModule
		],
		templateUrl: "./profile.html",
		styleUrl: "./profile.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Page for viewing and updating the current user's profile.
 *
 * Loads the current profile and available roles, exposes a reactive
 * `profileForm` for editing, and performs updates via `updateMutation`.
 *
 * @remarks
 * Uses `AccountService` for data operations and `NotificationService` for user feedback.
 */
export class ProfilePage
{
	/**
	 * Account service for fetching and updating the user's profile.
	 * @type {AccountService}
	 */
	private readonly accountService: AccountService =
		inject(AccountService);

	/**
	 * Form builder for constructing the reactive profile form.
	 * @type {FormBuilder}
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Notification service used to show success/error messages.
	 * @type {NotificationService}
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Query for loading the current user's profile (contains data/isLoading/error).
	 * @type {ReturnType<typeof this.accountService.getProfile>}
	 */
	readonly profileQuery: ReturnType<typeof this.accountService.getProfile> =
		this.accountService.getProfile();

	/**
	 * Mutation for updating the user's profile.
	 * @type {ReturnType<typeof this.accountService.updateProfile>}
	 */
	readonly updateMutation: ReturnType<typeof this.accountService.updateProfile> =
		this.accountService.updateProfile();

	/**
	 * Query for fetching roles available to the current user.
	 * @type {ReturnType<typeof this.accountService.getAvailableRoles>}
	 */
	readonly availableRolesQuery: ReturnType<typeof this.accountService.getAvailableRoles> =
		this
			.accountService
			.getAvailableRoles();

	// Skeleton theme constants
	/**
	 * Skeleton theme used for input placeholders.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonInput: SkeletonTheme = SKELETON_INPUT;
	/**
	 * Skeleton theme used for buttons.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonButton: SkeletonTheme = SKELETON_BUTTON;
	/**
	 * Short skeleton text theme.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonTextShort: SkeletonTheme = SKELETON_TEXT_SHORT;
	/**
	 * Medium-length skeleton text theme.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonTextMedium: SkeletonTheme =
		SKELETON_TEXT_MEDIUM;

	/**
	 * Computed signal exposing the current profile DTO.
	 * @type {Signal<UserProfileDto | undefined>}
	 */
	readonly profile: Signal<UserProfileDto | undefined> =
		computed(
			() => this.profileQuery.data());

	/**
	 * Loading state derived from the profile query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.profileQuery.isLoading());

	/**
	 * Indicates whether a profile update is pending.
	 * @type {Signal<boolean>}
	 */
	readonly isSaving: Signal<boolean> =
		computed(
			() => this.updateMutation.isPending());

	/**
	 * Maps query errors to a user-visible error message.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			() =>
				this.profileQuery.error() ? "Failed to load profile" : null);

	/**
	 * True when the current user has available roles to select.
	 * @type {Signal<boolean>}
	 */
	readonly hasAvailableRoles: Signal<boolean> =
		computed(
			() =>
			{
				const roles: AvailableRoleDto[] | undefined =
					this.availableRolesQuery.data();
				return (roles?.length ?? 0) > 0;
			});

	/**
	 * Reactive form used to edit the user's profile.
	 * @type {FormGroup}
	 */
	readonly profileForm: FormGroup =
		this.formBuilder.group(
			{
				email: [
					"",
					[
						Validators.required,
						Validators.email,
						Validators.maxLength(EMAIL_VALIDATION.MAX_LENGTH)
					]
				],
				fullName: ["", [Validators.maxLength(FULL_NAME_VALIDATION.MAX_LENGTH)]]
			});

	/**
	 * Computed signal exposing validation message for the email field.
	 * @type {Signal<string | null>}
	 */
	readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.profileForm.get("email"), "Email"));

	/**
	 * Initialize the ProfilePage and set up reactive effects for synchronizing
	 * profile data to the form.
	 * @returns {void}
	 */
	constructor()
	{
		effect(
			() =>
			{
				const currentProfile: UserProfileDto | undefined =
					this.profile();
				if (currentProfile)
				{
					this.populateForm(currentProfile);
				}
			});
	}

	/**
	 * Populate the reactive form from the given profile DTO and mark it pristine.
	 *
	 * @param {UserProfileDto} UserProfileDto
	 * Source profile data used to patch the form fields.
	 * @returns {void}
	 */
	private populateForm(UserProfileDto: UserProfileDto): void
	{
		this.profileForm.patchValue(
			{
				email: UserProfileDto.email,
				fullName: UserProfileDto.fullName || ""
			});
		this.profileForm.markAsPristine();
	}

	/**
	 * Submit the profile form and perform an update if the form is valid.
	 *
	 * Validates the form, constructs an {@link UpdateProfileRequest}, and
	 * invokes the `updateMutation`. Displays success or error notifications.
	 * @returns {Promise<void>}
	 */
	async onSubmit(): Promise<void>
	{
		if (this.profileForm.invalid)
		{
			this.profileForm.markAllAsTouched();
			return;
		}

		const request: UpdateProfileRequest =
			{
				email: this.profileForm.value.email,
				fullName: this.profileForm.value.fullName || undefined
			};

		try
		{
			await this.updateMutation.mutateAsync(request);
			this.notificationService.success("Profile updated");
			this.profileForm.markAsPristine();
		}
		catch
		{
			this.notificationService.error("Failed to update profile");
		}
	}
}
