import { ADMIN_ROUTES } from "@admin/constants";
import { UserDto } from "@admin/users/models";
import { UserService } from "@admin/users/services";
import { DatePipe } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	Signal
} from "@angular/core";
import { Router } from "@angular/router";
import { DataTableComponent } from "@shared/components";
import type {
	QuickFilter,
	RowAction,
	RowActionEvent,
	SortChangeEvent,
	TableColumn
} from "@shared/models";
import { DialogService } from "@shared/services/dialog.service";
import { NotificationService } from "@shared/services/notification.service";

/**
 * User list component.
 * Displays list of users with loading and error states.
 * Follows OnPush change detection for performance.
 * Uses signals for reactive state management.
 */
@Component(
	{
		selector: "app-user-list",
		imports: [DataTableComponent],
		providers: [DatePipe],
		templateUrl: "./user-list.html",
		styleUrls: ["./user-list.scss"],
		changeDetection: ChangeDetectionStrategy.OnPush
	})
export class UserList
{
	/**
	 * User service providing queries and mutations for user management.
	 * @type {UserService}
	 * @private
	 * @readonly
	 */
	private readonly userService: UserService =
		inject(UserService);

	/**
	 * Date pipe used to format displayed dates.
	 * @type {DatePipe}
	 * @private
	 * @readonly
	 */
	private readonly datePipe: DatePipe =
		inject(DatePipe);

	/**
	 * Angular Router used for navigating to user pages (view/edit).
	 * @type {Router}
	 * @private
	 * @readonly
	 */
	private readonly router: Router =
		inject(Router);

	/**
	 * Dialog service for confirmations and prompts.
	 * @type {DialogService}
	 * @private
	 * @readonly
	 */
	private readonly dialogService: DialogService =
		inject(DialogService);

	/**
	 * Notification service for user-facing messages.
	 * @type {NotificationService}
	 * @private
	 * @readonly
	 */
	private readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Query object for paged users with data/isLoading/error flags.
	 * @type {ReturnType<typeof this.userService.getPagedUsers>}
	 */
	readonly usersQuery: ReturnType<typeof this.userService.getPagedUsers> =
		this.userService.getPagedUsers();

	/**
	 * Mutation for updating user records.
	 * @type {ReturnType<typeof this.userService.updateUser>}
	 * @private
	 */
	private readonly updateUserMutation: ReturnType<typeof this.userService.updateUser> =
		this.userService.updateUser();

	/**
	 * Mutation for resetting a user's password.
	 * @type {ReturnType<typeof this.userService.resetPassword>}
	 * @private
	 */
	private readonly resetPasswordMutation: ReturnType<
		typeof this.userService.resetPassword> =
		this.userService.resetPassword();

	/**
	 * Mutation for restoring a soft-deleted user.
	 * @type {ReturnType<typeof this.userService.restoreUser>}
	 * @private
	 */
	private readonly restoreUserMutation: ReturnType<
		typeof this.userService.restoreUser> =
		this.userService.restoreUser();

	/**
	 * Computed array of users for the table (current page).
	 * @type {Signal<UserDto[]>}
	 */
	readonly data: Signal<UserDto[]> =
		computed(
			() =>
				(this.usersQuery.data()?.items as UserDto[]) ?? []);

	/**
	 * Loading indicator for users query.
	 * @type {Signal<boolean>}
	 */
	readonly isLoading: Signal<boolean> =
		computed(
			() => this.usersQuery.isLoading());

	/**
	 * Error message signal when loading users fails.
	 * @type {Signal<string | null>}
	 */
	readonly error: Signal<string | null> =
		computed(
			() =>
				this.usersQuery.error()
					? "Failed to load users. Please try again."
					: null);

	/**
	 * Total number of users across pages.
	 * @type {Signal<number>}
	 */
	readonly totalCount: Signal<number> =
		computed(
			() =>
				this.usersQuery.data()?.totalCount ?? 0);

	/**
	 * Current paginator zero-based page index.
	 * @type {Signal<number>}
	 */
	readonly pageIndex: Signal<number> =
		computed(
			() =>
				(this.userService.getCurrentFilter().page ?? 1) - 1);

	/**
	 * Current page size for the user list.
	 * @type {Signal<number>}
	 */
	readonly pageSize: Signal<number> =
		computed(
			() =>
				this.userService.getCurrentFilter().pageSize ?? 50);

	/**
	 * Column definitions for the user table.
	 * @type {TableColumn<UserDto>[]}
	 */
	readonly columns: TableColumn<UserDto>[] =
		[
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
				formatter: (value: unknown, row?: UserDto): string =>
				{
					if (row?.isDeleted)
					{
						return "Deleted";
					}
					return value === true ? "Active" : "Inactive";
				},
				badgeColor: (
					value: unknown,
					row?: UserDto): "primary" | "accent" | "warn" =>
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

	/**
	 * Predefined quick filters for the user list (e.g., active/inactive).
	 * @type {QuickFilter<UserDto>[]}
	 */
	readonly quickFilters: QuickFilter<UserDto>[] =
		[
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

	/**
	 * Actions available per user row (view, edit, reset password, restore, deactivate).
	 * @type {RowAction<UserDto>[]}
	 */
	readonly rowActions: RowAction<UserDto>[] =
		[
			{
				key: "view",
				label: "View Details",
				icon: "visibility"
			},
			{
				key: "edit",
				label: "Edit",
				icon: "edit",
				showIf: (user: UserDto): boolean =>
					!user.isDeleted
			},
			{
				key: "resetPassword",
				label: "Reset Password",
				icon: "lock_reset",
				color: "accent",
				showIf: (user: UserDto): boolean =>
					!user.isDeleted
			},
			{
				key: "restore",
				label: "Restore",
				icon: "restore",
				color: "primary",
				showIf: (user: UserDto): boolean =>
					user.isDeleted === true
			},
			{
				key: "deactivate",
				label: "Deactivate",
				icon: "person_off",
				color: "warn",
				showIf: (user: UserDto): boolean =>
					!user.isDeleted
			}
		];

	/**
	 * Apply a search filter to the user list.
	 * @param {string} searchTerm
	 * Text to search for in username or email.
	 * @returns {void}
	 */
	onSearch(searchTerm: string): void
	{
		this.userService.updateFilter(
			{ searchTerm: searchTerm || undefined });
	}

	/**
	 * Handle click on the create user button and navigate to the create page.
	 * @returns {void}
	 */
	public onCreateClick(): void
	{
		void this.router.navigate(
			[ADMIN_ROUTES.USERS.CREATE]);
	}

	/**
	 * Forces a refresh of the users query (bypassing cache).
	 * @returns {void}
	 */
	onRefresh(): void
	{
		void this.userService.forceRefresh();
	}

	/**
	 * Handle quick filter selection for the user list (active/inactive/deleted).
	 * @param {{ filterKey: string; }} event
	 * Contains the selected filter key.
	 * @returns {void}
	 */
	onFilterChange(event: { filterKey: string; }): void
	{
		const filterKey: string =
			event.filterKey;
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
				const currentFilter: { includeDeleted?: boolean; } =
					this.userService.getCurrentFilter();
				const currentValue: boolean =
					currentFilter.includeDeleted ?? false;
				isActive = undefined;
				includeDeleted = !currentValue;
				break;
		}

		this.userService.updateFilter(
			{
				isActive,
				includeDeleted
			});
	}

	/**
	 * Handle sort change from the data table.
	 * @param {SortChangeEvent} event
	 * Sort field and direction.
	 * @returns {void}
	 */
	onSortChange(event: SortChangeEvent): void
	{
		this.userService.updateFilter(
			{
				sortBy: event.sortBy,
				sortDescending: event.sortDescending
			});
	}

	/**
	 * Handle row-level actions (view/edit/reset/restore/deactivate).
	 * @param {RowActionEvent<UserDto>} event
	 * The row action event payload.
	 * @returns {void}
	 */
	onRowAction(event: RowActionEvent<UserDto>): void
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

	/**
	 * Update paginator page index.
	 * @param {number} pageIndex
	 * Zero-based page index selected by the paginator.
	 * @returns {void}
	 */
	onPageChange(pageIndex: number): void
	{
		this.userService.setPage(pageIndex + 1);
	}

	/**
	 * Update page size for the user list.
	 * @param {number} pageSize
	 * New page size selected by the user.
	 * @returns {void}
	 */
	onPageSizeChange(pageSize: number): void
	{
		this.userService.setPageSize(pageSize);
	}

	/**
	 * Handles row click to navigate to the user details.
	 * @param {UserDto} user
	 * The clicked user row.
	 * @returns {void}
	 */
	onRowClick(user: UserDto): void
	{
		this.viewUser(user.id);
	}

	/**
	 * Navigates to the user details view page.
	 * @param {number} userId
	 * The user ID to view.
	 * @returns {void}
	 */
	private viewUser(userId: number): void
	{
		void this.router.navigate(
			[ADMIN_ROUTES.USERS.DETAIL(userId)]);
	}

	/**
	 * Navigates to the user edit page.
	 * @param {number} userId
	 * The user ID to edit.
	 * @returns {void}
	 */
	private editUser(userId: number): void
	{
		void this.router.navigate(
			[ADMIN_ROUTES.USERS.EDIT(userId)]);
	}

	/**
	 * Initiates password reset for a user.
	 * @param {UserDto} user
	 * The user to reset password for.
	 * @returns {void}
	 */
	private resetUserPassword(user: UserDto): void
	{
		this
		.dialogService
		.confirm(
			{
				title: "Reset Password",
				message:
						`Are you sure you want to reset the password for "${user.username}"? They will receive an email with instructions to set a new password.`,
				confirmText: "Reset Password"
			})
		.subscribe(
			(confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.resetPasswordMutation.mutate(user.id,
					{
						onSuccess: () =>
						{
							this.notificationService.success(
								`Password reset email sent to ${user.email}`);
						},
						onError: (error: Error) =>
						{
							this.notificationService.error(
								`Failed to reset password: ${error.message}`);
						}
					});
			});
	}

	/**
	 * Deactivates a single user (soft delete).
	 * @param {UserDto} user
	 * The user to deactivate.
	 * @returns {void}
	 */
	private deactivateUser(user: UserDto): void
	{
		this
		.dialogService
		.confirmDeactivate("user")
		.subscribe(
			(confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.updateUserMutation.mutate(
					{
						userId: user.id,
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
								`User "${user.username}" deactivated successfully`);
						},
						onError: (error: Error) =>
						{
							this.notificationService.error(
								`Failed to deactivate user: ${error.message}`);
						}
					});
			});
	}

	/**
	 * Restores a soft-deleted user.
	 * @param {UserDto} user
	 * The user to restore.
	 * @returns {void}
	 */
	private handleRestoreUser(user: UserDto): void
	{
		this
		.dialogService
		.confirm(
			{
				title: "Restore User",
				message: `Are you sure you want to restore user "${user.username}"?`,
				confirmText: "Restore",
				cancelText: "Cancel"
			})
		.subscribe(
			(confirmed: boolean) =>
			{
				if (!confirmed)
				{
					return;
				}

				this.restoreUserMutation.mutate(user.id,
					{
						onSuccess: () =>
						{
							this.notificationService.success(
								`User "${user.username}" restored successfully`);
						},
						onError: (error: Error) =>
						{
							this.notificationService.error(
								`Failed to restore user: ${error.message}`);
						}
					});
			});
	}
}
