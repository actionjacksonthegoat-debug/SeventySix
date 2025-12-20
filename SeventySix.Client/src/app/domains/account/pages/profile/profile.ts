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
	EMAIL_VALIDATION,
	FULL_NAME_VALIDATION
} from "@shared/constants/validation.constants";
import { NotificationService } from "@shared/services";
import { getValidationError } from "@shared/utilities";

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
			RouterLink
		],
		templateUrl: "./profile.html",
		styleUrl: "./profile.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class ProfilePage
{
	private readonly accountService: AccountService =
		inject(AccountService);
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	readonly profileQuery: ReturnType<typeof this.accountService.getProfile> =
		this.accountService.getProfile();
	readonly updateMutation: ReturnType<typeof this.accountService.updateProfile> =
		this.accountService.updateProfile();
	readonly availableRolesQuery: ReturnType<typeof this.accountService.getAvailableRoles> =
		this.accountService.getAvailableRoles();

	readonly profile: Signal<UserProfileDto | undefined> =
		computed(
			() => this.profileQuery.data());
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.profileQuery.isLoading());
	readonly isSaving: Signal<boolean> =
		computed(
			() => this.updateMutation.isPending());
	readonly error: Signal<string | null> =
		computed(
			() =>
				this.profileQuery.error() ? "Failed to load profile" : null);
	readonly hasAvailableRoles: Signal<boolean> =
		computed(
			() =>
			{
				const roles: AvailableRoleDto[] | undefined =
					this.availableRolesQuery.data();
				return (roles?.length ?? 0) > 0;
			});

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

	readonly emailError: Signal<string | null> =
		computed(
			() =>
				getValidationError(this.profileForm.get("email"), "Email"));

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

	private populateForm(UserProfileDto: UserProfileDto): void
	{
		this.profileForm.patchValue(
			{
				email: UserProfileDto.email,
				fullName: UserProfileDto.fullName || ""
			});
		this.profileForm.markAsPristine();
	}

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
