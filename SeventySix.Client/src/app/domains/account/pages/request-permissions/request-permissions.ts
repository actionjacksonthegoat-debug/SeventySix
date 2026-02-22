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
import { PageHeaderComponent } from "@shared/components";
import {
	SKELETON_CHECKBOX,
	SKELETON_TEXT_MEDIUM,
	SKELETON_TEXT_SHORT,
	SkeletonTheme
} from "@shared/constants";
import { NotificationService } from "@shared/services";
import { toggleSetItem } from "@shared/utilities/selection.utility";
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
			NgxSkeletonLoaderModule,
			PageHeaderComponent
		],
		templateUrl: "./request-permissions.html",
		styleUrl: "./request-permissions.scss",
		changeDetection: ChangeDetectionStrategy.OnPush
	})
/**
 * Page for requesting additional account roles.
 *
 * Allows the user to select roles, provide an optional message and submit a
 * permission request via `AccountService.createPermissionRequest`.
 */
export class RequestPermissionsPage
{
	/**
	 * Account service for account-related operations.
	 * @type {AccountService}
	 */
	private readonly accountService: AccountService =
		inject(AccountService);

	/**
	 * Form builder for constructing reactive forms.
	 * @type {FormBuilder}
	 */
	private readonly formBuilder: FormBuilder =
		inject(FormBuilder);

	/**
	 * Router used for navigation after successful actions.
	 * @type {Router}
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Notification service for user-facing messages.
	 * @type {NotificationService}
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Query for fetching available roles for the current user.
	 * @type {ReturnType<typeof this.accountService.getAvailableRoles>}
	 */
	readonly rolesQuery: ReturnType<typeof this.accountService.getAvailableRoles> =
		this
			.accountService
			.getAvailableRoles();

	/**
	 * Mutation used to submit permission requests.
	 * @type {ReturnType<typeof this.accountService.createPermissionRequest>}
	 */
	readonly requestMutation: ReturnType<typeof this.accountService.createPermissionRequest> =
		this
			.accountService
			.createPermissionRequest();

	/**
	 * Available roles returned by the server for selection.
	 * @type {Signal<AvailableRoleDto[]>}
	 */
	readonly availableRoles: Signal<AvailableRoleDto[]> =
		computed(
			() => this.rolesQuery.data() ?? []);

	/**
	 * Loading state for the roles query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.rolesQuery.isLoading());

	/**
	 * Submission pending state for the request mutation.
	 * @type {Signal<boolean>}
	 */
	readonly isSubmitting: Signal<boolean> =
		computed(
			() => this.requestMutation.isPending());

	// Skeleton theme constants
	/**
	 * Skeleton theme used for checkboxes.
	 * @type {SkeletonTheme}
	 */
	readonly skeletonCheckbox: SkeletonTheme = SKELETON_CHECKBOX;
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
	 * Mutable set of selected role names.
	 * @type {WritableSignal<Set<string>>}
	 */
	readonly selectedRoles: WritableSignal<Set<string>> =
		signal(
			new Set<string>());

	/**
	 * Reactive form for permission requests.
	 * @type {FormGroup}
	 */
	readonly requestForm: FormGroup =
		this.formBuilder.group(
			{
				requestMessage: ["", [Validators.maxLength(500)]]
			});

	/**
	 * Toggle selection state for the given role name.
	 *
	 * Adds the role to the selection set if not present, otherwise removes it.
	 *
	 * @param {string} roleName
	 * The name of the role to toggle.
	 * @returns {void}
	 */
	toggleRole(roleName: string): void
	{
		this.selectedRoles.set(
			toggleSetItem(
				this.selectedRoles(),
				roleName));
	}

	/**
	 * Submit a permission request for the currently selected roles.
	 *
	 * Validates that at least one role is selected, builds a
	 * {@link CreatePermissionRequestDto}, and invokes the `requestMutation`.
	 * On success navigates back to the account page and shows a success
	 * notification.
	 * @returns {Promise<void>}
	 */
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
				requestMessage: this.requestForm.value.requestMessage
					? this.requestForm.value.requestMessage
					: undefined
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