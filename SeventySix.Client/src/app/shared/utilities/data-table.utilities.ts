// <copyright file="table.utility.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { DateRangeEvent } from "@shared/models";

/**
 * Date range configuration for table filters.
 * Used by date range dropdown in data tables.
 */
export interface DateRangeConfig
{
	icon: string;
	label: string;
}

/**
 * Date range key type for type-safe access.
 */
export type DateRangeKey = "1h" | "24h" | "7d" | "30d";

/**
 * Static utility functions for DataTableComponent.
 * Stateless helpers that simplify component logic and improve readability.
 * Follows KISS, DRY principles - no state management, pure functions only.
 */
export class DataTableUtilities
{
	/**
	 * Date range display configuration (DRY - single source of truth).
	 */
	static readonly DATE_RANGE_CONFIG: Readonly<Record<DateRangeKey, DateRangeConfig>> =
		Object.freeze(
			{
				"1h": { icon: "schedule", label: "1 Hour" },
				"24h": { icon: "today", label: "24 Hours" },
				"7d": { icon: "date_range", label: "7 Days" },
				"30d": { icon: "calendar_month", label: "30 Days" }
			});

	/**
	 * Date range duration in milliseconds.
	 */
	private static readonly DATE_RANGE_MS: Readonly<Record<DateRangeKey, number>> =
		Object.freeze(
			{
				"1h": 60 * 60 * 1000,
				"24h": 24 * 60 * 60 * 1000,
				"7d": 7 * 24 * 60 * 60 * 1000,
				"30d": 30 * 24 * 60 * 60 * 1000
			});

	/**
	 * Preset mapping for date range events.
	 */
	private static readonly PRESET_MAP: Readonly<Record<DateRangeKey, "24h" | "7d" | "30d">> =
		Object.freeze(
			{
				"1h": "24h",
				"24h": "24h",
				"7d": "7d",
				"30d": "30d"
			});

	/**
	 * Gets the icon for a date range key.
	 * @param range - Date range key
	 * @returns Icon name or default "today"
	 */
	static getDateRangeIcon(range: string): string
	{
		const config: DateRangeConfig | undefined =
			DataTableUtilities.DATE_RANGE_CONFIG[range as DateRangeKey];
		return config?.icon ?? "today";
	}

	/**
	 * Gets the label for a date range key.
	 * @param range - Date range key
	 * @returns Label text or default "24 Hours"
	 */
	static getDateRangeLabel(range: string): string
	{
		const config: DateRangeConfig | undefined =
			DataTableUtilities.DATE_RANGE_CONFIG[range as DateRangeKey];
		return config?.label ?? "24 Hours";
	}

	/**
	 * Calculates date range event from range key and current time.
	 * @param range - Date range key
	 * @param now - Current date/time
	 * @returns DateRangeEvent or null if range is invalid
	 */
	static calculateDateRange(range: string, now: Date): DateRangeEvent | null
	{
		const rangeMs: number | undefined =
			DataTableUtilities.DATE_RANGE_MS[range as DateRangeKey];

		if (!rangeMs)
		{
			return null;
		}

		return {
			startDate: new Date(now.getTime() - rangeMs),
			endDate: now,
			preset: DataTableUtilities.PRESET_MAP[range as DateRangeKey]
		};
	}

	/**
	 * Parses column visibility preferences from JSON string.
	 * @param json - JSON string from localStorage
	 * @returns Map of column key to visibility, or null if invalid
	 */
	static parseColumnPreferences(json: string): Map<string, boolean> | null
	{
		try
		{
			const preferences: Record<string, unknown> =
				JSON.parse(json);
			const visibility: Map<string, boolean> =
				new Map<string, boolean>();

			Object
			.entries(preferences)
			.forEach(
				([key, value]) =>
				{
					if (typeof value === "boolean")
					{
						visibility.set(key, value);
					}
				});

			return visibility;
		}
		catch
		{
			return null;
		}
	}

	/**
	 * Serializes column visibility map to JSON for localStorage.
	 * @param visibility - Column visibility map
	 * @returns JSON string
	 */
	static serializeColumnPreferences(visibility: Map<string, boolean>): string
	{
		const preferences: Record<string, boolean> = {};
		visibility.forEach(
			(value, key) =>
			{
				preferences[key] = value;
			});
		return JSON.stringify(preferences);
	}

	/**
	 * Updates filter set based on toggle action and selection mode.
	 * @param currentFilters - Current active filters
	 * @param filterKey - Key being toggled
	 * @param singleSelection - Whether single selection mode is enabled
	 * @returns New filter set and whether the filter became active
	 */
	static updateFilters(
		currentFilters: Set<string>,
		filterKey: string,
		singleSelection: boolean): { filters: Set<string>; active: boolean; }
	{
		const filters: Set<string> =
			new Set(currentFilters);
		const wasActive: boolean =
			filters.has(filterKey);
		const active: boolean = !wasActive;

		if (singleSelection && active)
		{
			filters.clear();
			filters.add(filterKey);
		}
		else if (active)
		{
			filters.add(filterKey);
		}
		else
		{
			filters.delete(filterKey);
		}

		return { filters, active };
	}
}