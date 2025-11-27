/**
 * TableColumn Test Data Builder
 * Simplifies creation of TableColumn objects for testing
 * Follows Builder pattern for test data creation
 */

import { TableColumn } from "@shared/models";

/**
 * Fluent builder for TableColumn test data
 * Provides sensible defaults while allowing customization
 *
 * @example
 * const column = new TableColumnBuilder<User>()
 *   .withKey('name')
 *   .withLabel('User Name')
 *   .sortable()
 *   .build();
 */
export class TableColumnBuilder<T>
{
	private column: Partial<TableColumn<T>> = {
		visible: true,
		sortable: false,
		type: "text"
	};

	/**
	 * Set the column key
	 */
	withKey(key: keyof T & string): this
	{
		this.column.key = key;
		return this;
	}

	/**
	 * Set the column label
	 */
	withLabel(label: string): this
	{
		this.column.label = label;
		return this;
	}

	/**
	 * Make column sortable
	 */
	sortable(): this
	{
		this.column.sortable = true;
		return this;
	}

	/**
	 * Make column non-sortable
	 */
	notSortable(): this
	{
		this.column.sortable = false;
		return this;
	}

	/**
	 * Make column visible
	 */
	visible(): this
	{
		this.column.visible = true;
		return this;
	}

	/**
	 * Make column hidden
	 */
	hidden(): this
	{
		this.column.visible = false;
		return this;
	}

	/**
	 * Set column type to text
	 */
	asText(): this
	{
		this.column.type = "text";
		return this;
	}

	/**
	 * Set column type to date
	 */
	asDate(): this
	{
		this.column.type = "date";
		return this;
	}

	/**
	 * Set column type to badge
	 */
	asBadge(
		badgeColor?: (value: unknown) => "primary" | "accent" | "warn"
	): this
	{
		this.column.type = "badge";
		if (badgeColor)
		{
			this.column.badgeColor = badgeColor;
		}
		return this;
	}

	/**
	 * Build the TableColumn object
	 */
	build(): TableColumn<T>
	{
		if (!this.column.key)
		{
			throw new Error("TableColumn must have a key");
		}
		if (!this.column.label)
		{
			throw new Error("TableColumn must have a label");
		}
		return this.column as TableColumn<T>;
	}
}

/**
 * Create a basic text column
 */
export function createTextColumn<T>(
	key: keyof T & string,
	label: string,
	isSortable: boolean = false
): TableColumn<T>
{
	const builder: TableColumnBuilder<T> = new TableColumnBuilder<T>()
		.withKey(key)
		.withLabel(label)
		.asText();

	if (isSortable)
	{
		builder.sortable();
	}

	return builder.build();
}

/**
 * Create a date column
 */
export function createDateColumn<T>(
	key: keyof T & string,
	label: string,
	sortable: boolean = true
): TableColumn<T>
{
	const builder: TableColumnBuilder<T> = new TableColumnBuilder<T>()
		.withKey(key)
		.withLabel(label)
		.asDate();

	if (sortable)
	{
		builder.sortable();
	}

	return builder.build();
}

/**
 * Create a badge column
 */
export function createBadgeColumn<T>(
	key: keyof T & string,
	label: string,
	badgeColor: (value: unknown) => "primary" | "accent" | "warn"
): TableColumn<T>
{
	return new TableColumnBuilder<T>()
		.withKey(key)
		.withLabel(label)
		.asBadge(badgeColor)
		.build();
}
