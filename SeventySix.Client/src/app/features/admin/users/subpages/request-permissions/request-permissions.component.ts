import {
	Component,
	inject,
	ChangeDetectionStrategy,
	Signal,
	computed,
	signal,
	WritableSignal
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { PermissionRequestService } from "@admin/permission-requests/services";
import { AvailableRole } from "@admin/permission-requests/models";

/**
 * Page for users to request elevated permissions.
 * Shows available roles and allows submission with optional message.
 */
@Component({
	selector: "app-request-permissions",
	imports: [
		ReactiveFormsModule,
		MatCardModule,
		MatCheckboxModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatProgressSpinnerModule,
		MatSnackBarModule
	],
	templateUrl: "./request-permissions.component.html",
	styleUrls: ["./request-permissions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestPermissionsComponent
{
	private readonly service: PermissionRequestService =
		inject(PermissionRequestService);
	private readonly router: Router = inject(Router);
	private readonly route: ActivatedRoute = inject(ActivatedRoute);
	private readonly fb: FormBuilder = inject(FormBuilder);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	readonly rolesQuery: ReturnType<
		PermissionRequestService["getAvailableRoles"]
	> =
		this.service.getAvailableRoles();

	readonly createMutation: ReturnType<
		PermissionRequestService["createRequest"]
	> =
		this.service.createRequest();

	readonly availableRoles: Signal<AvailableRole[]> = computed(
		() => this.rolesQuery.data() ?? []
	);

	readonly isLoading: Signal<boolean> = computed(() =>
		this.rolesQuery.isLoading()
	);

	readonly isSaving: Signal<boolean> = computed(() =>
		this.createMutation.isPending()
	);

	readonly selectedRoles: WritableSignal<Set<string>> = signal(new Set());

	readonly form: FormGroup = this.fb.group({
		requestMessage: ["", [Validators.maxLength(500)]]
	});

	readonly hasSelectedRoles: Signal<boolean> = computed(
		() => this.selectedRoles().size > 0
	);

	readonly noRolesAvailable: Signal<boolean> = computed(
		() => !this.isLoading() && this.availableRoles().length === 0
	);

	toggleRole(roleName: string): void
	{
		const current: Set<string> = new Set(this.selectedRoles());
		if (current.has(roleName))
		{
			current.delete(roleName);
		}
		else
		{
			current.add(roleName);
		}
		this.selectedRoles.set(current);
	}

	isRoleSelected(roleName: string): boolean
	{
		return this.selectedRoles().has(roleName);
	}

	submit(): void
	{
		if (!this.hasSelectedRoles())
		{
			return;
		}

		const requestMessage: string | undefined =
			this.form.value.requestMessage || undefined;

		this.createMutation.mutate(
			{
				requestedRoles: Array.from(this.selectedRoles()),
				requestMessage
			},
			{
				onSuccess: () =>
				{
					this.snackBar.open(
						"Permission request submitted successfully",
						"Close",
						{ duration: 3000 }
					);
					// Navigate back to parent (user profile)
					this.router.navigate([".."], { relativeTo: this.route });
				},
				onError: () =>
				{
					this.snackBar.open(
						"Failed to submit request. Please try again.",
						"Close",
						{ duration: 5000 }
					);
				}
			}
		);
	}
}
