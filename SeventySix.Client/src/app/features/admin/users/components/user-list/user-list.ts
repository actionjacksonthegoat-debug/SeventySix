import {
	Component,
	inject,
	signal,
	computed,
	ChangeDetectionStrategy,
	ViewChild,
	AfterViewInit,
	effect,
	Signal,
	WritableSignal
} from "@angular/core";
import { Router } from "@angular/router";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatSortModule, MatSort } from "@angular/material/sort";
import { MatPaginatorModule, MatPaginator } from "@angular/material/paginator";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatCardModule } from "@angular/material/card";
import { MatMenuModule } from "@angular/material/menu";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { SelectionModel } from "@angular/cdk/collections";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { UserService } from "@admin/users/services";
import { LoggerService } from "@core/services";
import { User } from "@admin/users/models";
import {
	ChartComponent,
	ConfirmDialogComponent,
	type ConfirmDialogData
} from "@shared/components";
import { ChartConfiguration } from "chart.js";

/**
 * User list component.
 * Displays list of users with loading and error states.
 * Follows OnPush change detection for performance.
 * Uses signals for reactive state management.
 */
@Component({
	selector: "app-user-list",
	imports: [
		MatTableModule,
		MatSortModule,
		MatPaginatorModule,
		MatInputModule,
		MatFormFieldModule,
		MatButtonModule,
		MatIconModule,
		MatChipsModule,
		MatTooltipModule,
		MatProgressSpinnerModule,
		MatCardModule,
		MatMenuModule,
		MatCheckboxModule,
		MatExpansionModule,
		FormsModule,
		DatePipe,
		ChartComponent
	],
	templateUrl: "./user-list.html",
	styleUrls: ["./user-list.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserList implements AfterViewInit
{
	private readonly userService: UserService = inject(UserService);
	private readonly logger: LoggerService = inject(LoggerService);
	private readonly router: Router = inject(Router);
	private readonly dialog: MatDialog = inject(MatDialog);
	private readonly snackBar: MatSnackBar = inject(MatSnackBar);

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	// TanStack Query handles loading, error, and data states
	readonly usersQuery: ReturnType<UserService["getAllUsers"]> =
		this.userService.getAllUsers();

	// Computed signals for derived state
	readonly users: Signal<User[]> = computed(
		() => this.usersQuery.data() ?? []
	);
	readonly isLoading: Signal<boolean> = computed(() =>
		this.usersQuery.isLoading()
	);
	readonly error: Signal<string | null> = computed(() =>
		this.usersQuery.error()
			? "Failed to load users. Please try again."
			: null
	);
	readonly searchFilter: WritableSignal<string> = signal<string>("");
	readonly statusFilter: WritableSignal<"all" | "active" | "inactive"> =
		signal<"all" | "active" | "inactive">("all");
	readonly chartExpanded: WritableSignal<boolean> = signal<boolean>(false);

	// Material table data source
	readonly dataSource: MatTableDataSource<User> =
		new MatTableDataSource<User>([]);

	// Column visibility configuration
	readonly columnDefs: WritableSignal<
		Array<{
			key: string;
			label: string;
			visible: boolean;
			sortable: boolean;
		}>
	> = signal([
		{ key: "select", label: "Select", visible: true, sortable: false },
		{ key: "id", label: "ID", visible: true, sortable: true },
		{ key: "username", label: "Username", visible: true, sortable: true },
		{ key: "email", label: "Email", visible: true, sortable: true },
		{ key: "fullName", label: "Full Name", visible: true, sortable: true },
		{ key: "isActive", label: "Status", visible: true, sortable: true },
		{ key: "createdAt", label: "Created", visible: true, sortable: true },
		{ key: "actions", label: "Actions", visible: true, sortable: false }
	]);

	// Bulk selection
	readonly selection: SelectionModel<User> = new SelectionModel<User>(
		true,
		[]
	);

	// Computed: visible columns
	readonly displayedColumns: Signal<string[]> = computed(() =>
		this.columnDefs()
			.filter((col) => col.visible)
			.map((col) => col.key)
	);

	// Computed signals for derived state
	readonly hasUsers: Signal<boolean> = computed(
		() => this.users().length > 0
	);
	readonly userCount: Signal<number> = computed(() => this.users().length);
	readonly activeUserCount: Signal<number> = computed(
		() => this.users().filter((u) => u.isActive).length
	);
	readonly inactiveUserCount: Signal<number> = computed(
		() => this.users().filter((u) => !u.isActive).length
	);
	readonly selectedCount: Signal<number> = computed(
		() => this.selection.selected.length
	);

	// Chart data for user statistics
	readonly userStatsChartData: Signal<ChartConfiguration["data"]> = computed<
		ChartConfiguration["data"]
	>(() =>
	{
		const users: User[] = this.users();
		// Group users by created month
		const monthCounts: Record<
			string,
			{ active: number; inactive: number }
		> = {};

		users.forEach((user) =>
		{
			const date: Date = new Date(user.createdAt);
			const monthKey: string = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

			if (!monthCounts[monthKey])
			{
				monthCounts[monthKey] = { active: 0, inactive: 0 };
			}

			if (user.isActive)
			{
				monthCounts[monthKey].active++;
			}
			else
			{
				monthCounts[monthKey].inactive++;
			}
		});

		// Sort months and get last 6 months
		const sortedMonths: string[] = Object.keys(monthCounts)
			.sort()
			.slice(-6);
		const labels: string[] = sortedMonths.map((key) =>
		{
			const [year, month]: string[] = key.split("-");
			const date: Date = new Date(parseInt(year), parseInt(month) - 1);
			return date.toLocaleDateString("en-US", {
				month: "short",
				year: "numeric"
			});
		});

		return {
			labels,
			datasets: [
				{
					label: "Active Users",
					data: sortedMonths.map((key) => monthCounts[key].active),
					borderColor: "rgb(75, 192, 192)",
					backgroundColor: "rgba(75, 192, 192, 0.2)",
					tension: 0.4,
					fill: true
				},
				{
					label: "Inactive Users",
					data: sortedMonths.map((key) => monthCounts[key].inactive),
					borderColor: "rgb(255, 99, 132)",
					backgroundColor: "rgba(255, 99, 132, 0.2)",
					tension: 0.4,
					fill: true
				}
			]
		};
	});

	// Computed: filtered data based on status
	readonly filteredUsers: Signal<User[]> = computed(() =>
	{
		const filter: "all" | "active" | "inactive" = this.statusFilter();
		const allUsers: User[] = this.users();

		if (filter === "all") return allUsers;
		if (filter === "active") return allUsers.filter((u) => u.isActive);
		if (filter === "inactive") return allUsers.filter((u) => !u.isActive);
		return allUsers;
	});

	constructor()
	{
		this.loadUsers();

		// Update table data when users change
		effect(() =>
		{
			this.updateTableData();
		});

		// Log successful data load
		effect(() =>
		{
			const users: User[] = this.users();
			const isLoading: boolean = this.usersQuery.isLoading();
			const isError: boolean = this.usersQuery.isError();

			if (!isLoading && !isError && users.length > 0)
			{
				this.logger.info("Users loaded successfully", {
					count: users.length
				});
			}
		});

		// Log errors
		effect(() =>
		{
			const error: Error | null = this.usersQuery.error();
			if (error)
			{
				this.logger.error("Failed to load users", error);
			}
		});
	}

	ngAfterViewInit(): void
	{
		this.dataSource.sort = this.sort;
		this.dataSource.paginator = this.paginator;

		// Custom filter predicate for search
		this.dataSource.filterPredicate = (data: User, filter: string) =>
		{
			const searchStr: string = filter.toLowerCase();
			return (
				data.username.toLowerCase().includes(searchStr) ||
				data.email.toLowerCase().includes(searchStr) ||
				data.fullName?.toLowerCase().includes(searchStr) ||
				false ||
				data.id.toString().includes(searchStr)
			);
		};

		// Load column visibility from localStorage
		this.loadColumnPreferences();
	}

	/**
	 * Loads column visibility preferences from localStorage
	 */
	loadColumnPreferences(): void
	{
		const saved: string | null = localStorage.getItem("userListColumns");
		if (saved)
		{
			try
			{
				const prefs: Record<string, boolean> = JSON.parse(saved);
				this.columnDefs.update((cols) =>
					cols.map((col) => ({
						...col,
						visible: prefs[col.key] ?? col.visible
					}))
				);
			}
			catch (err)
			{
				this.logger.error(
					"Failed to load column preferences",
					err as Error
				);
			}
		}
	}

	/**
	 * Saves column visibility preferences to localStorage
	 */
	saveColumnPreferences(): void
	{
		const prefs: Record<string, boolean> = this.columnDefs().reduce(
			(acc, col) =>
			{
				acc[col.key] = col.visible;
				return acc;
			},
			{} as Record<string, boolean>
		);
		localStorage.setItem("userListColumns", JSON.stringify(prefs));
	}

	/**
	 * Toggles column visibility
	 */
	toggleColumn(columnKey: string): void
	{
		this.columnDefs.update((cols) =>
			cols.map((col) =>
				col.key === columnKey ? { ...col, visible: !col.visible } : col
			)
		);
		this.saveColumnPreferences();
	}

	/**
	 * Loads users from the service.
	 */
	loadUsers(): void
	{
		this.usersQuery.refetch();
	}

	/**
	 * Updates table data based on current filters
	 */
	updateTableData(): void
	{
		this.dataSource.data = this.filteredUsers();
		this.selection.clear();
	}

	/**
	 * Sets status filter and updates table
	 */
	setStatusFilter(status: "all" | "active" | "inactive"): void
	{
		this.statusFilter.set(status);
		this.updateTableData();
		this.logger.info("Status filter changed", { status });
	}

	/**
	 * Applies search filter to the table.
	 */
	applyFilter(): void
	{
		this.dataSource.filter = this.searchFilter().trim().toLowerCase();

		if (this.dataSource.paginator)
		{
			this.dataSource.paginator.firstPage();
		}
	}

	/**
	 * Clears the search filter.
	 */
	clearFilter(): void
	{
		this.searchFilter.set("");
		this.applyFilter();
	}

	/**
	 * Retries loading users.
	 */
	retry(): void
	{
		this.loadUsers();
	}

	/**
	 * Navigates to add new user page.
	 */
	addUser(): void
	{
		this.router.navigate(["/admin/users/create"]);
		this.logger.info("Navigating to create user");
	}

	/**
	 * Navigates to edit user page.
	 * @param user The user to edit
	 */
	editUser(user: User): void
	{
		this.router.navigate(["/admin/users", user.id]);
		this.logger.info("Navigating to user detail", { userId: user.id });
	}

	/**
	 * Navigates to log management filtered by this user
	 * @param user The user to view logs for
	 */
	viewUserLogs(user: User): void
	{
		// Navigate to log management with query params to filter by user
		this.router.navigate(["/admin/logs"], {
			queryParams: {
				userId: user.id,
				userName: user.username
			}
		});
		this.logger.info("Navigating to logs for user", {
			userId: user.id,
			username: user.username
		});
	}

	/**
	 * Gets the status chip color for a user.
	 * @param user The user object
	 * @returns Chip color
	 */
	getStatusColor(user: User): "primary" | "warn" | undefined
	{
		return user.isActive ? "primary" : "warn";
	}

	/**
	 * Checks if all rows are selected
	 */
	isAllSelected(): boolean
	{
		const numSelected: number = this.selection.selected.length;
		const numRows: number = this.dataSource.data.length;
		return numSelected === numRows && numRows > 0;
	}

	/**
	 * Toggles all rows selection
	 */
	toggleAllRows(): void
	{
		if (this.isAllSelected())
		{
			this.selection.clear();
		}
		else
		{
			this.dataSource.data.forEach((row) => this.selection.select(row));
		}
	}

	/**
	 * Deletes selected users (bulk action)
	 */
	deleteSelected(): void
	{
		const count: number = this.selection.selected.length;
		if (count === 0) return;

		const dialogData: ConfirmDialogData = {
			title: "Delete Users",
			message: `Are you sure you want to delete ${count} user${count > 1 ? "s" : ""}? This action cannot be undone.`,
			confirmText: "Delete",
			cancelText: "Cancel",
			confirmColor: "warn",
			icon: "warning"
		};

		const dialogRef: import("@angular/material/dialog").MatDialogRef<ConfirmDialogComponent> =
			this.dialog.open(ConfirmDialogComponent, {
				data: dialogData,
				width: "450px",
				disableClose: false,
				autoFocus: true,
				restoreFocus: true
			});

		dialogRef.afterClosed().subscribe((confirmed) =>
		{
			if (confirmed)
			{
				this.logger.info("Bulk delete confirmed", { count });
				// TODO: Implement actual delete operation with API call
				// For now, just show success message
				this.showSuccessMessage(
					`${count} user${count > 1 ? "s" : ""} deleted`,
					"UNDO"
				);
				this.selection.clear();
			}
			else
			{
				this.logger.info("Bulk delete cancelled");
			}
		});
	}

	/**
	 * Exports selected users to CSV
	 */
	exportSelected(): void
	{
		const users: User[] = this.selection.selected;
		const count: number = users.length;
		if (count === 0) return;

		this.logger.info("Export requested", { count });

		// TODO: Implement actual CSV export
		// For now, just show a message
		this.showSuccessMessage(
			`Exported ${count} user${count > 1 ? "s" : ""} to CSV`
		);
	}

	/**
	 * Show success message with optional action
	 */
	private showSuccessMessage(message: string, action?: string): void
	{
		const snackBarRef: import("@angular/material/snack-bar").MatSnackBarRef<
			import("@angular/material/snack-bar").TextOnlySnackBar
		> = this.snackBar.open(message, action, {
			duration: action ? 5000 : 3000,
			horizontalPosition: "end",
			verticalPosition: "bottom",
			politeness: "polite"
		});

		if (action)
		{
			snackBarRef.onAction().subscribe(() =>
			{
				this.logger.info("Undo action triggered");
				// TODO: Implement undo functionality
			});
		}
	}

	/**
	 * Refreshes chart data (reloads users)
	 */
	onChartRefresh(): void
	{
		this.logger.info("Chart refresh requested");
		this.loadUsers();
	}

	/**
	 * Exports chart as PNG
	 */
	onChartExportPng(): void
	{
		this.logger.info("Chart PNG export requested");
		// TODO: Implement chart PNG export using Chart.js toBase64Image
		alert("Export chart as PNG (Not implemented)");
	}

	/**
	 * Exports chart data as CSV
	 */
	onChartExportCsv(): void
	{
		this.logger.info("Chart CSV export requested");
		// TODO: Implement chart data CSV export
		alert("Export chart data as CSV (Not implemented)");
	}
}
