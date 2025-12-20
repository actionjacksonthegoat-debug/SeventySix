import { AvailableRoleDto, CreatePermissionRequestDto } from "@account/models";
import { AccountService } from "@account/services";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Router } from "@angular/router";
import {
	SKELETON_CHECKBOX,
	SKELETON_TEXT_MEDIUM,
	SKELETON_TEXT_SHORT,
	SkeletonTheme
} from "@shared/constants";
import { NotificationService } from "@shared/services";
import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

@Component(
	{
		selector: "app-request-permissions",
		imports: [
			ReactiveFormsModule,
			MatFormFieldModule,
			MatInputModule,
			MatButtonModule,
			MatCardModule,
			MatCheckboxModule,
			MatProgressSpinnerModule,
			NgxSkeletonLoaderModule
		],
		templateUrl: "./request-permissions.html",
		styleUrl: "./request-permissions.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class RequestPermissionsPage
{
	private readonly accountService: AccountService =
		inject(AccountService);
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);
	private readonly router: Router =
		inject(Router);
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	readonly rolesQuery: ReturnType<typeof this.accountService.getAvailableRoles> =
		this.accountService.getAvailableRoles();
	readonly requestMutation: ReturnType<
		typeof this.accountService.createPermissionRequest> =
		this.accountService.createPermissionRequest();

	readonly availableRoles: Signal<AvailableRoleDto[]> =
		computed(
			() => this.rolesQuery.data() ?? []);
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.rolesQuery.isLoading());
	readonly isSubmitting: Signal<boolean> =
		computed(
			() => this.requestMutation.isPending());

	// Skeleton theme constants
	readonly skeletonCheckbox: SkeletonTheme =
		SKELETON_CHECKBOX;
	readonly skeletonTextShort: SkeletonTheme =
		SKELETON_TEXT_SHORT;
	readonly skeletonTextMedium: SkeletonTheme =
		SKELETON_TEXT_MEDIUM;

	readonly selectedRoles: WritableSignal<Set<string>> =
		signal(
			new Set<string>());

	/** Pre-computed role selection map for template. */
	readonly roleSelectionMap: Signal<Map<string, boolean>> =
		computed(
			() =>
			{
				const selected: Set<string> =
					this.selectedRoles();
				const map: Map<string, boolean> =
					new Map();
				this
				.availableRoles()
				.forEach(
					(role: AvailableRoleDto) =>
					{
						map.set(role.name, selected.has(role.name));
					});
				return map;
			});

	readonly requestForm: FormGroup =
		this.formBuilder.group(
			{
				requestMessage: ["", [Validators.maxLength(500)]]
			});

	toggleRole(roleName: string): void
	{
		const current: Set<string> =
			this.selectedRoles();
		const updated: Set<string> =
			new Set(current);

		if (updated.has(roleName))
		{
			updated.delete(roleName);
		}
		else
		{
			updated.add(roleName);
		}

		this.selectedRoles.set(updated);
	}

	async onSubmit(): Promise<void>
	{
		const roles: string[] =
			Array.from(this.selectedRoles());
		if (roles.length === 0)
		{
			this.notificationService.warning("Select at least one role");
			return;
		}

		const request: CreatePermissionRequestDto =
			{
				requestedRoles: roles,
				requestMessage: this.requestForm.value.requestMessage || undefined
			};

		try
		{
			await this.requestMutation.mutateAsync(request);
			this.notificationService.success("Permission request submitted");
			this.router.navigate(
				["/account"]);
		}
		catch
		{
			this.notificationService.error("Failed to submit request");
		}
	}
}
