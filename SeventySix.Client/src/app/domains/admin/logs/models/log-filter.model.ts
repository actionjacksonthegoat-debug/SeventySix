import { DateRangePreset } from "@admin/logs/constants";
import { BaseQueryRequest } from "@shared/models";
import { DateService } from "@shared/services";

/** Log query request DTO matching backend LogQueryRequest. */
export interface LogQueryRequest extends BaseQueryRequest
{
	/** Filter by log level (e.g., Information, Warning, Error). */
	logLevel?: string | null;

	/** Additional context information for filtering logs. */
	sourceContext?: string | null;
}

/**
 * Helper to get date range from a preset.
 * @param {DateRangePreset} preset
 * The preset selecting the desired date range (e.g., Last24Hours, Last7Days).
 * @param {DateService} dateService
 * Service used to compute and normalize dates in UTC.
 * @returns {{ startDate: Date | null; endDate: Date | null }}
 * Start and end dates for the selected preset. `null` for custom or unspecified ranges.
 */
export function getDateRangeFromPreset(
	preset: DateRangePreset,
	dateService: DateService): {
	startDate: Date | null;
	endDate: Date | null;
}
{
	const now: Date =
		dateService.parseUTC(dateService.now());
	const endDate: Date = now;
	let startDate: Date | null = null;

	switch (preset)
	{
		case DateRangePreset.Last1Hour:
			startDate =
				dateService.addHours(now, -1);
			break;
		case DateRangePreset.Last6Hours:
			startDate =
				dateService.addHours(now, -6);
			break;
		case DateRangePreset.Last24Hours:
			startDate =
				dateService.addHours(now, -24);
			break;
		case DateRangePreset.Last7Days:
			startDate =
				dateService.addDays(now, -7);
			break;
		case DateRangePreset.Last30Days:
			startDate =
				dateService.addDays(now, -30);
			break;
		case DateRangePreset.Custom:
			return { startDate: null, endDate: null };
		default:
			return { startDate: null, endDate: null };
	}

	return { startDate, endDate };
}

/**
 * Helper to get display label for a date range preset.
 * @param {DateRangePreset} preset
 * The date range preset to get a human-readable label for.
 * @returns {string}
 * Readable label for the supplied preset (e.g., 'Last 24 Hours').
 */
export function getDateRangePresetLabel(preset: DateRangePreset): string
{
	switch (preset)
	{
		case DateRangePreset.Last1Hour:
			return "Last 1 Hour";
		case DateRangePreset.Last6Hours:
			return "Last 6 Hours";
		case DateRangePreset.Last24Hours:
			return "Last 24 Hours";
		case DateRangePreset.Last7Days:
			return "Last 7 Days";
		case DateRangePreset.Last30Days:
			return "Last 30 Days";
		case DateRangePreset.Custom:
			return "Custom Range";
		default:
			return "All Time";
	}
}
