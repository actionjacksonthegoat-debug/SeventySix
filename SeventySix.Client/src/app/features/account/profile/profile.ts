import {
	Component,
	computed,
	effect,
	inject,
	ChangeDetectionStrategy,
	Signal
} from "@angular/core";
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
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { RouterLink } from "@angular/router";
import { AccountService } from "../services";
import { Profile, UpdateProfileRequest } from "../models";

@Component({
	selector: "app-profile-page",
	imports: [
		ReactiveFormsModule,
		DatePipe,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatSnackBarModule,
		RouterLink
	],
	templateUrl: "./profile.html",
	styleUrl: "./profile.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePage
{
	private readonly accountService: AccountService = inject(AccountService);
	private readonly fb: FormBuilder = inject(FormBuilder);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	readonly profileQuery: ReturnType<AccountService["getProfile"]> =
		this.accountService.getProfile();
	readonly updateMutation: ReturnType<AccountService["updateProfile"]> =
		this.accountService.updateProfile();

	readonly profile: Signal<Profile | undefined> =
		computed(() => this.profileQuery.data());
	readonly isLoading: Signal<boolean> =
		computed(() => this.profileQuery.isLoading());
	readonly isSaving: Signal<boolean> =
		computed(() => this.updateMutation.isPending());
	readonly error: Signal<string | null> =
		computed(() => this.profileQuery.error() ? "Failed to load profile" : null);

	readonly profileForm: FormGroup = this.fb.group({
		email: [
			"",
			[Validators.required, Validators.email, Validators.maxLength(255)]
		],
		fullName: ["", [Validators.maxLength(100)]]
	});

	constructor()
	{
		effect(() =>
		{
			const currentProfile: Profile | undefined = this.profile();
			if (currentProfile)
			{
				this.populateForm(currentProfile);
			}
		});
	}

	private populateForm(profile: Profile): void
	{
		this.profileForm.patchValue({
			email: profile.email,
			fullName: profile.fullName || ""
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
			this.snackBar.open(
				"Profile updated",
				"Close",
				{ duration: 3000 }
			);
			this.profileForm.markAsPristine();
		}
		catch
		{
			this.snackBar.open(
				"Failed to update profile",
				"Close",
				{ duration: 5000 }
			);
		}
	}
}
