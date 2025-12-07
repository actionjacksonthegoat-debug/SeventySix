import {
	Component,
	inject,
	computed,
	ChangeDetectionStrategy,
	Signal
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { UserService } from "@admin/users/services";
import { DialogService } from "@infrastructure/services/dialog.service";
import { NotificationService } from "@infrastructure/services/notification.service";
import { User } from "@admin/users/models";
import { DataTableComponent } from "@shared/components";
import type {
	TableColumn,
	QuickFilter,
	RowAction,
	RowActionEvent,
	SortChangeEvent
} from "@shared/models";

/**
 * User list component.
 * Displays list of users with loading and error states.
 * Follows OnPush change detection for performance.
 * Uses signals for reactive state management.
 */
@Component({
	selector: "app-user-list",
	imports: [DataTableComponent],
	providers: [DatePipe],
	templateUrl: "./user-list.html",
	styleUrls: ["./user-list.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserList
{
	private readonly userService: UserService = inject(UserService);
	private readonly datePipe: DatePipe = inject(DatePipe);
	private readonly router: Router = inject(Router);
	private readonly dialogService: DialogService = inject(DialogService);
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	readonly usersQuery: ReturnType<UserService["getPagedUsers"]> =
		this.userService.getPagedUsers();

	// Mutations
	private readonly updateUserMutation: ReturnType<UserService["updateUser"]> =
		this.userService.updateUser();
	private readonly resetPasswordMutation: ReturnType<
		UserService["resetPassword"]
	> = this.userService.resetPassword();
	private readonly restoreUserMutation: ReturnType<
		UserService["restoreUser"]
	> = this.userService.restoreUser();

	readonly data: Signal<User[]> = computed(
		() => this.usersQuery.data()?.items ?? []
	);
	readonly isLoading: Signal<boolean> = computed(() =>
		this.usersQuery.isLoading()
	);
	readonly error: Signal<string | null> = computed(() =>
		this.usersQuery.error()
			? "Failed to load users. Please try again."
			: null
	);
	readonly totalCount: Signal<number> = computed(
		() => this.usersQuery.data()?.totalCount ?? 0
	);
	readonly pageIndex: Signal<number> = computed(
		() => (this.userService.getCurrentFilter().page ?? 1) - 1
	);
	readonly pageSize: Signal<number> = computed(
		() => this.userService.getCurrentFilter().pageSize ?? 50
	);

	readonly columns: TableColumn<User>[] = [
		{
			key: "id",
			label: "ID",
			type: "text",
			sortable: true,
			visible: false
		},
		{
			key: "username",
			label: "Username",
			type: "text",
			sortable: true,
			visible: false
		},
		{
			key: "email",
			label: "Email",
			type: "text",
			sortable: true,
			visible: false
		},
		{
			key: "fullName",
			label: "Full Name",
			type: "text",
			sortable: true,
			visible: true
		},
		{
			key: "isActive",
			label: "Status",
			type: "badge",
			sortable: true,
			visible: true,
			formatter: (value: unknown, row?: User): string =>
			{
				if (row?.isDeleted)
				{
					return "Deleted";
				}
				return value === true ? "Active" : "Inactive";
			},
			badgeColor: (
				value: unknown,
				row?: User
			): "primary" | "accent" | "warn" =>
			{
				if (row?.isDeleted)
				{
					return "warn";
				}
				return value === true ? "primary" : "accent";
			}
		},
		{
			key: "createDate",
			label: "Created",
			type: "date",
			sortable: true,
			visible: true,
			formatter: (value: unknown): string =>
				this.datePipe.transform(value as string, "short") ?? ""
		},
		{
			key: "lastLoginAt",
			label: "Last Login",
			type: "date",
			sortable: true,
			visible: true,
			formatter: (value: unknown): string =>
				value
					? (this.datePipe.transform(value as string, "short") ?? "")
					: "Never"
		}
	];

	readonly quickFilters: QuickFilter<User>[] = [
		{
			key: "all",
			label: "All Users",
			icon: "people"
		},
		{
			key: "active",
			label: "Active",
			icon: "check_circle"
		},
		{
			key: "inactive",
			label: "Inactive",
			icon: "cancel"
		},
		{
			key: "deleted",
			label: "Show Deleted",
			icon: "delete"
		}
	];

	readonly rowActions: RowAction<User>[] = [
		{
			key: "view",
			label: "View Details",
			icon: "visibility"
		},
		{
			key: "edit",
			label: "Edit",
			icon: "edit",
			showIf: (user: User): boolean => !user.isDeleted
		},
		{
			key: "resetPassword",
			label: "Reset Password",
			icon: "lock_reset",
			color: "accent",
			showIf: (user: User): boolean => !user.isDeleted
		},
		{
			key: "restore",
			label: "Restore",
			icon: "restore",
			color: "primary",
			showIf: (user: User): boolean => user.isDeleted === true
		},
		{
			key: "deactivate",
			label: "Deactivate",
			icon: "person_off",
			color: "warn",
			showIf: (user: User): boolean => !user.isDeleted
		}
	];

	onSearch(searchTerm: string): void
	{
		this.userService.updateFilter({ searchTerm: searchTerm || undefined });
	}

	onRefresh(): void
	{
		void this.userService.forceRefresh();
	}

	onFilterChange(event: { filterKey: string }): void
	{
		const filterKey: string = event.filterKey;
		let isActive: boolean | undefined = undefined;
		let includeDeleted: boolean | undefined = undefined;

		switch (filterKey)
		{
			case "all":
				// Show all active and inactive users (no filter)
				isActive = undefined;
				includeDeleted = false;
				break;
			case "active":
				// Show only active users
				isActive = true;
				includeDeleted = false;
				break;
			case "inactive":
				// Show only inactive users
				isActive = false;
				includeDeleted = false;
				break;
			case "deleted":
				// Toggle showing deleted users
				const currentFilter: { includeDeleted?: boolean } =
					this.userService.getCurrentFilter();
				const currentValue: boolean =
					currentFilter.includeDeleted ?? false;
				isActive = undefined;
				includeDeleted = !currentValue;
				break;
		}

		this.userService.updateFilter({
			isActive,
			includeDeleted
		});
	}

	/**
	 * Handles sort change from data table
	 * @param event - Sort change event with column and direction
	 */
	onSortChange(event: SortChangeEvent): void
	{
		this.userService.updateFilter({
			sortBy: event.sortBy,
			sortDescending: event.sortDescending
		});
	}

	onRowAction(event: RowActionEvent<User>): void
	{
		switch (event.action)
		{
			case "view":
				this.viewUser(event.row.id);
				break;
			case "edit":
				this.editUser(event.row.id);
				break;
			case "resetPassword":
				this.resetUserPassword(event.row);
				break;
			case "restore":
				this.handleRestoreUser(event.row);
				break;
			case "deactivate":
				this.deactivateUser(event.row);
				break;
		}
	}

	onPageChange(pageIndex: number): void
	{
		this.userService.setPage(pageIndex + 1);
	}

	onPageSizeChange(pageSize: number): void
	{
		this.userService.setPageSize(pageSize);
	}

	/**
	 * Handles row click to navigate to user details
	 * @param user - The clicked user row
	 */
	onRowClick(user: User): void
	{
		this.viewUser(user.id);
	}

	/**
	 * Navigates to the user details view page
	 * @param userId - The user ID to view
	 */
	private viewUser(userId: number): void
	{
		void this.router.navigate(["/admin/users", userId]);
	}

	/**
	 * Navigates to the user edit page
	 * @param userId - The user ID to edit
	 */
	private editUser(userId: number): void
	{
		void this.router.navigate(["/admin/users", userId, "edit"]);
	}

	/**
	 * Initiates password reset for a user
	 * @param user - The user to reset password for
	 */
	private resetUserPassword(user: User): void
	{
		this.dialogService
			.confirm({
				title: "Reset Password",
				message: `Are you sure you want to reset the password for "${user.username}"? They will receive an email with instructions to set a new password.`,
				confirmText: "Reset Password"
			})
			.subscribe((confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.resetPasswordMutation.mutate(user.id, {
					onSuccess: () =>
					{
						this.notificationService.success(
							`Password reset email sent to ${user.email}`
						);
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to reset password: ${error.message}`
						);
					}
				});
			});
	}

	/**
	 * Deactivates a single user (soft delete)
	 * @param user - The user to deactivate
	 */
	private deactivateUser(user: User): void
	{
		this.dialogService
			.confirmDeactivate("user")
			.subscribe((confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.updateUserMutation.mutate(
					{
						id: user.id,
						user: {
							id: user.id,
							username: user.username,
							email: user.email,
							fullName: user.fullName,
							isActive: false
						}
					},
					{
						onSuccess: () =>
						{
							this.notificationService.success(
								`User "${user.username}" deactivated successfully`
							);
						},
						onError: (error: Error) =>
						{
							this.notificationService.error(
								`Failed to deactivate user: ${error.message}`
							);
						}
					}
				);
			});
	}

	/**
	 * Restores a soft-deleted user
	 * @param user - The user to restore
	 */
	private handleRestoreUser(user: User): void
	{
		this.dialogService
			.confirm({
				title: "Restore User",
				message: `Are you sure you want to restore user "${user.username}"?`,
				confirmText: "Restore",
				cancelText: "Cancel"
			})
			.subscribe((confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.restoreUserMutation.mutate(user.id, {
					onSuccess: () =>
					{
						this.notificationService.success(
							`User "${user.username}" restored successfully`
						);
					},
					onError: (error: Error) =>
					{
						this.notificationService.error(
							`Failed to restore user: ${error.message}`
						);
					}
				});
			});
	}
}
