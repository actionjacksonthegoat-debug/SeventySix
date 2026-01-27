import { DateRangeEvent } from "@shared/models";
import { DateService } from "@shared/services";

/**
 * Date range configuration for table filters.
 * Used by date range dropdown in data tables.
 */
export interface DateRangeConfig
{
	/**
	 * @type {string}
	 * Icon name used for the date range (Material icon name).
	 */
	icon: string;

	/**
	 * @type {string}
	 * Human-readable label for the date range.
	 */
	label: string;
}

/**
 * Date range key type for type-safe access.
 *
 * @type {"1h" | "24h" | "7d" | "30d"}
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
	 * @type {Readonly<Record<DateRangeKey, DateRangeConfig>>}
	 * @readonly
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
	 * @type {Readonly<Record<DateRangeKey, number>>}
	 * @private
	 * @readonly
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
	 * @type {Readonly<Record<DateRangeKey, "24h" | "7d" | "30d">>}
	 * @private
	 * @readonly
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
	 * @param {string} range
	 * The date range key to look up.
	 * @returns {string}
	 * Icon name for the given date range, or 'today' when unknown.
	 */
	static getDateRangeIcon(range: string): string
	{
		const config: DateRangeConfig | undefined =
			DataTableUtilities.DATE_RANGE_CONFIG[range as DateRangeKey];
		return config?.icon ?? "today";
	}

	/**
	 * Gets the label for a date range key.
	 * @param {string} range
	 * The date range key to look up.
	 * @returns {string}
	 * Label text for the given date range, or '24 Hours' when unknown.
	 */
	static getDateRangeLabel(range: string): string
	{
		const config: DateRangeConfig | undefined =
			DataTableUtilities.DATE_RANGE_CONFIG[range as DateRangeKey];
		return config?.label ?? "24 Hours";
	}

	/**
	 * Calculates date range event from range key and current time.
	 * @param {string} range
	 * The date range key to calculate.
	 * @param {Date} now
	 * The current date/time used as the end date.
	 * @param {DateService} dateService
	 * Optional DateService instance for date calculations.
	 * @returns {DateRangeEvent | null}
	 * The calculated DateRangeEvent or null if the range key is invalid.
	 */
	static calculateDateRange(
		range: string,
		now: Date,
		dateService: DateService = new DateService()): DateRangeEvent | null
	{
		const rangeMs: number | undefined =
			DataTableUtilities.DATE_RANGE_MS[range as DateRangeKey];

		if (!rangeMs)
		{
			return null;
		}

		let startDate: Date;
		// Prefer DateService helpers to create dates for consistency and testability
		switch (range as DateRangeKey)
		{
			case "1h":
				startDate =
					dateService.addHours(now, -1);
				break;
			case "24h":
				startDate =
					dateService.addHours(now, -24);
				break;
			case "7d":
				startDate =
					dateService.addDays(now, -7);
				break;
			case "30d":
				startDate =
					dateService.addDays(now, -30);
				break;
			default:
				startDate =
					dateService.fromMillis(now.getTime() - rangeMs);
		}

		return {
			startDate,
			endDate: now,
			preset: DataTableUtilities.PRESET_MAP[range as DateRangeKey]
		};
	}

	/**
	 * Parses column visibility preferences from JSON string.
	 * @param {string} json
	 * JSON string retrieved from localStorage representing column visibility.
	 * @returns {Map<string, boolean> | null}
	 * A Map of column key to visibility or null if parsing failed.
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
	 * @param {Map<string, boolean>} visibility
	 * The column visibility map to serialize.
	 * @returns {string}
	 * A JSON string representing the visibility preferences.
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
	 * @param {Set<string>} currentFilters
	 * The current set of active filters.
	 * @param {string} filterKey
	 * The filter key being toggled.
	 * @param {boolean} singleSelection
	 * When true, only a single filter may be active.
	 * @returns {{ filters: Set<string>; active: boolean; }}
	 * New filter set and a boolean indicating whether the filter became active.
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
