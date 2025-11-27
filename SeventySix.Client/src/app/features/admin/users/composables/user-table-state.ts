/**
 * User Table State Composable
 * Manages table configuration, column visibility, and display settings
 * Follows Composable pattern for reusable state management
 */

import { signal, WritableSignal, Signal, computed } from "@angular/core";

export interface ColumnDefinition
{
	key: string;
	label: string;
	visible: boolean;
	sortable: boolean;
}

/**
 * Default column configuration for user table
 */
const DEFAULT_COLUMNS: ColumnDefinition[] = [
	{ key: "select", label: "Select", visible: true, sortable: false },
	{ key: "id", label: "ID", visible: true, sortable: true },
	{ key: "username", label: "Username", visible: true, sortable: true },
	{ key: "email", label: "Email", visible: true, sortable: true },
	{ key: "fullName", label: "Full Name", visible: true, sortable: true },
	{ key: "isActive", label: "Status", visible: true, sortable: true },
	{ key: "createDate", label: "Created", visible: true, sortable: true },
	{
		key: "lastLoginAt",
		label: "Last Login",
		visible: false,
		sortable: true
	},
	{
		key: "modifyDate",
		label: "Modified",
		visible: false,
		sortable: true
	},
	{
		key: "modifiedBy",
		label: "Modified By",
		visible: false,
		sortable: true
	},
	{
		key: "createdBy",
		label: "Created By",
		visible: false,
		sortable: true
	},
	{ key: "actions", label: "Actions", visible: true, sortable: false }
];

/**
 * User table state composable
 * Encapsulates table configuration and column management
 */
export function createUserTableState()
{
	const columns: WritableSignal<ColumnDefinition[]> = signal(
		structuredClone(DEFAULT_COLUMNS)
	);

	const displayedColumns: Signal<string[]> = computed(() =>
		columns()
			.filter((col) => col.visible)
			.map((col) => col.key)
	);

	const searchFilter: WritableSignal<string> = signal("");
	const statusFilter: WritableSignal<"all" | "active" | "inactive"> =
		signal("all");
	const chartExpanded: WritableSignal<boolean> = signal(false);

	function toggleColumn(key: string): void
	{
		columns.update((cols) =>
			cols.map((col) =>
				col.key === key ? { ...col, visible: !col.visible } : col
			)
		);
	}

	function resetColumns(): void
	{
		columns.set(structuredClone(DEFAULT_COLUMNS));
	}

	function setSearchFilter(value: string): void
	{
		searchFilter.set(value);
	}

	function setStatusFilter(value: "all" | "active" | "inactive"): void
	{
		statusFilter.set(value);
	}

	function toggleChartExpanded(): void
	{
		chartExpanded.update((expanded) => !expanded);
	}

	return {
		// State
		columns,
		displayedColumns,
		searchFilter,
		statusFilter,
		chartExpanded,

		// Actions
		toggleColumn,
		resetColumns,
		setSearchFilter,
		setStatusFilter,
		toggleChartExpanded
	};
}

export type UserTableState = ReturnType<typeof createUserTableState>;
