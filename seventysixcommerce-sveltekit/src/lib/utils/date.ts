/**
 * Date utility functions.
 * Re-exports shared date utilities and adds SvelteKit-specific helpers.
 * All date operations in the application should use these functions
 * instead of native Date constructors.
 */
import { addDays as dateFnsAddDays } from "date-fns";

export { currentYear, now } from "@seventysixcommerce/shared/date";

/**
 * Adds the specified number of days to the given date.
 * @param date - The starting date.
 * @param days - The number of days to add.
 * @returns {Date} A new Date with the days added.
 */
export function addDays(date: Date, days: number): Date
{
	return dateFnsAddDays(date, days);
}
