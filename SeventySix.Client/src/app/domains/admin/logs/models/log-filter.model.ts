import { BaseQueryRequest } from "@shared/models";
import { DateService } from "@shared/services";
import { DateRangePreset } from "@admin/logs/constants";

/** Log query request DTO matching backend LogQueryRequest. */
export interface LogQueryRequest extends BaseQueryRequest
{
	/** Filter by log level (e.g., Information, Warning, Error). */
	logLevel?: string | null;

	/** Additional context information for filtering logs. */
	sourceContext?: string | null;
}

/** Helper to get date range from preset. */
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
				new Date(now.getTime() - 6 * 60 * 60 * 1000);
			break;
		case DateRangePreset.Last24Hours:
			startDate =
				new Date(now.getTime() - 24 * 60 * 60 * 1000);
			break;
		case DateRangePreset.Last7Days:
			startDate =
				new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case DateRangePreset.Last30Days:
			startDate =
				new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		case DateRangePreset.Custom:
			return { startDate: null, endDate: null };
		default:
			return { startDate: null, endDate: null };
	}

	return { startDate, endDate };
}

/** Helper to get display label for date range preset. */
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
