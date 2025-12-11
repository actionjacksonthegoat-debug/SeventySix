import {
	Component,
	computed,
	inject,
	signal,
	ChangeDetectionStrategy,
	Signal,
	WritableSignal
} from "@angular/core";
import {
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators
} from "@angular/forms";
import { Router } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { AccountService } from "../services";
import { AvailableRoleDto, CreatePermissionRequestDto } from "../models";

@Component({
	selector: "app-request-permissions",
	imports: [
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatCheckboxModule,
		MatProgressSpinnerModule,
		MatSnackBarModule
	],
	templateUrl: "./request-permissions.html",
	styleUrl: "./request-permissions.scss",
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestPermissionsPage
{
	private readonly accountService: AccountService = inject(AccountService);
	private readonly fb: FormBuilder = inject(FormBuilder);
	private readonly router: Router = inject(Router);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	readonly rolesQuery: ReturnType<AccountService["getAvailableRoles"]> =
		this.accountService.getAvailableRoles();
	readonly requestMutation: ReturnType<
		AccountService["createPermissionRequest"]
	> = this.accountService.createPermissionRequest();

	readonly availableRoles: Signal<AvailableRoleDto[]> = computed(
		() => this.rolesQuery.data() ?? []
	);
	readonly isLoading: Signal<boolean> = computed(() =>
		this.rolesQuery.isLoading());
	readonly isSubmitting: Signal<boolean> = computed(() =>
		this.requestMutation.isPending());

	readonly selectedRoles: WritableSignal<Set<string>> = signal(
		new Set<string>()
	);

	/** Pre-computed role selection map for template. */
	readonly roleSelectionMap: Signal<Map<string, boolean>> = computed(() =>
	{
		const selected: Set<string> = this.selectedRoles();
		const map: Map<string, boolean> = new Map();
		this.availableRoles().forEach((role: AvailableRoleDto) =>
		{
			map.set(role.name, selected.has(role.name));
		});
		return map;
	});

	readonly requestForm: FormGroup = this.fb.group({
		requestMessage: ["", [Validators.maxLength(500)]]
	});

	toggleRole(roleName: string): void
	{
		const current: Set<string> = this.selectedRoles();
		const updated: Set<string> = new Set(current);

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
		const roles: string[] = Array.from(this.selectedRoles());
		if (roles.length === 0)
		{
			this.snackBar.open("Select at least one role", "Close", {
				duration: 3000
			});
			return;
		}

		const request: CreatePermissionRequestDto = {
			requestedRoles: roles,
			requestMessage: this.requestForm.value.requestMessage || undefined
		};

		try
		{
			await this.requestMutation.mutateAsync(request);
			this.snackBar.open("Permission request submitted", "Close", {
				duration: 3000
			});
			this.router.navigate(["/account"]);
		}
		catch
		{
			this.snackBar.open("Failed to submit request", "Close", {
				duration: 5000
			});
		}
	}
}
