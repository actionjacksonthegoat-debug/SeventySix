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
import { NotificationService } from "@infrastructure/services/notification.service";
import { User } from "@admin/users/models";
import { DataTableComponent } from "@shared/components";
import type {
	TableColumn,
	QuickFilter,
	RowAction,
	BulkAction,
	RowActionEvent,
	BulkActionEvent,
	DateRangeEvent
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
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	readonly usersQuery: ReturnType<UserService["getPagedUsers"]> =
		this.userService.getPagedUsers();

	// Mutations
	private readonly updateUserMutation: ReturnType<UserService["updateUser"]> =
		this.userService.updateUser();
	private readonly deleteUserMutation: ReturnType<UserService["deleteUser"]> =
		this.userService.deleteUser();
	private readonly bulkActivateMutation: ReturnType<
		UserService["bulkActivateUsers"]
	> = this.userService.bulkActivateUsers();
	private readonly bulkDeactivateMutation: ReturnType<
		UserService["bulkDeactivateUsers"]
	> = this.userService.bulkDeactivateUsers();

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
		() => (this.userService.getCurrentFilter().pageNumber ?? 1) - 1
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
			visible: true
		},
		{
			key: "username",
			label: "Username",
			type: "text",
			sortable: true,
			visible: true
		},
		{
			key: "email",
			label: "Email",
			type: "text",
			sortable: true,
			visible: true
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
			formatter: (value: unknown): string =>
				value === true ? "Active" : "Inactive",
			badgeColor: (value: unknown): "primary" | "accent" | "warn" =>
				value === true ? "primary" : "warn"
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
			visible: false,
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
			icon: "edit"
		},
		{
			key: "toggleStatus",
			label: "Toggle Status",
			icon: "swap_horiz"
		},
		{
			key: "delete",
			label: "Delete",
			icon: "delete",
			color: "warn"
		}
	];

	readonly bulkActions: BulkAction[] = [
		{
			key: "activate",
			label: "Activate Selected",
			icon: "check_circle",
			color: "primary"
		},
		{
			key: "deactivate",
			label: "Deactivate Selected",
			icon: "cancel",
			color: "accent"
		},
		{
			key: "delete",
			label: "Delete Selected",
			icon: "delete",
			color: "warn"
		}
	];

	onSearch(searchTerm: string): void
	{
		this.userService.updateFilter({ searchTerm: searchTerm || undefined });
	}

	onRefresh(): void
	{
		void this.usersQuery.refetch();
	}

	onFilterChange(event: { filterKey: string }): void
	{
		const filterKey: string = event.filterKey;
		let includeInactive: boolean | undefined = undefined;

		switch (filterKey)
		{
			case "all":
				// Show all users (active + inactive)
				includeInactive = true;
				break;
			case "active":
				// Show only active users
				includeInactive = false;
				break;
			case "inactive":
				// Show only inactive users (need to filter server-side)
				// This would need backend support for isActive=false filter
				includeInactive = true;
				break;
		}

		this.userService.updateFilter({ includeInactive });
	}

	onDateRangeChange(event: DateRangeEvent): void
	{
		// Update filter with date range (filters by LastLogin)
		this.userService.updateFilter({
			startDate: event.startDate,
			endDate: event.endDate
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
			case "toggleStatus":
				this.toggleUserStatus(event.row);
				break;
			case "delete":
				this.deleteUser(event.row.id, event.row.username);
				break;
		}
	}

	onBulkAction(event: BulkActionEvent): void
	{
		switch (event.action)
		{
			case "activate":
				this.bulkActivateUsers(event.selectedIds);
				break;
			case "deactivate":
				this.bulkDeactivateUsers(event.selectedIds);
				break;
			case "delete":
				this.bulkDeleteUsers(event.selectedIds);
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
	 * Toggles a user's active status
	 * @param user - The user to toggle
	 */
	private toggleUserStatus(user: User): void
	{
		const newStatus: boolean = !user.isActive;
		const action: string = newStatus ? "activate" : "deactivate";

		if (
			!confirm(
				`Are you sure you want to ${action} user "${user.username}"?`
			)
		)
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
					isActive: newStatus
				}
			},
			{
				onSuccess: () =>
				{
					this.notificationService.success(
						`User "${user.username}" ${action}d successfully`
					);
				},
				onError: (error: Error) =>
				{
					this.notificationService.error(
						`Failed to ${action} user: ${error.message}`
					);
				}
			}
		);
	}

	/**
	 * Deletes a single user
	 * @param userId - The user ID to delete
	 * @param username - The username for confirmation message
	 */
	private deleteUser(userId: number, username: string): void
	{
		if (
			!confirm(
				`Are you sure you want to delete user "${username}"? This action cannot be undone.`
			)
		)
		{
			return;
		}

		this.deleteUserMutation.mutate(userId, {
			onSuccess: () =>
			{
				this.notificationService.success(
					`User "${username}" deleted successfully`
				);
			},
			onError: (error: Error) =>
			{
				this.notificationService.error(
					`Failed to delete user: ${error.message}`
				);
			}
		});
	}

	/**
	 * Bulk activates multiple users
	 * @param userIds - Array of user IDs to activate
	 */
	private bulkActivateUsers(userIds: number[]): void
	{
		if (userIds.length === 0)
		{
			this.notificationService.warning(
				"No users selected for activation"
			);
			return;
		}

		const count: number = userIds.length;
		if (
			!confirm(
				`Are you sure you want to activate ${count} user${count === 1 ? "" : "s"}?`
			)
		)
		{
			return;
		}

		this.bulkActivateMutation.mutate(userIds, {
			onSuccess: (activatedCount: number) =>
			{
				this.notificationService.success(
					`Successfully activated ${activatedCount} user${activatedCount === 1 ? "" : "s"}`
				);
			},
			onError: (error: Error) =>
			{
				this.notificationService.error(
					`Failed to activate users: ${error.message}`
				);
			}
		});
	}

	/**
	 * Bulk deactivates multiple users
	 * @param userIds - Array of user IDs to deactivate
	 */
	private bulkDeactivateUsers(userIds: number[]): void
	{
		if (userIds.length === 0)
		{
			this.notificationService.warning(
				"No users selected for deactivation"
			);
			return;
		}

		const count: number = userIds.length;
		if (
			!confirm(
				`Are you sure you want to deactivate ${count} user${count === 1 ? "" : "s"}?`
			)
		)
		{
			return;
		}

		this.bulkDeactivateMutation.mutate(userIds, {
			onSuccess: (deactivatedCount: number) =>
			{
				this.notificationService.success(
					`Successfully deactivated ${deactivatedCount} user${deactivatedCount === 1 ? "" : "s"}`
				);
			},
			onError: (error: Error) =>
			{
				this.notificationService.error(
					`Failed to deactivate users: ${error.message}`
				);
			}
		});
	}

	/**
	 * Bulk deletes multiple users
	 * @param userIds - Array of user IDs to delete
	 */
	private bulkDeleteUsers(userIds: number[]): void
	{
		if (userIds.length === 0)
		{
			this.notificationService.warning("No users selected for deletion");
			return;
		}

		const count: number = userIds.length;
		if (
			!confirm(
				`Are you sure you want to delete ${count} user${count === 1 ? "" : "s"}? This action cannot be undone.`
			)
		)
		{
			return;
		}

		// Delete users one by one (could be optimized with a batch endpoint if available)
		let successCount: number = 0;
		let errorCount: number = 0;

		// Process deletions sequentially to handle errors properly
		const deleteNext: (index: number) => void = (index: number): void =>
		{
			if (index >= userIds.length)
			{
				// All done
				if (successCount > 0)
				{
					this.notificationService.success(
						`Successfully deleted ${successCount} user${successCount === 1 ? "" : "s"}`
					);
				}
				if (errorCount > 0)
				{
					this.notificationService.error(
						`Failed to delete ${errorCount} user${errorCount === 1 ? "" : "s"}`
					);
				}
				return;
			}

			this.deleteUserMutation.mutate(userIds[index], {
				onSuccess: () =>
				{
					successCount++;
					deleteNext(index + 1);
				},
				onError: () =>
				{
					errorCount++;
					deleteNext(index + 1);
				}
			});
		};

		deleteNext(0);
	}
}
