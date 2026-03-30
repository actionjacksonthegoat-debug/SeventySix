/**
 * Date utility functions wrapping date-fns.
 * All date operations in the application should use these functions
 * instead of native Date constructors.
 */
import { addDays as dateFnsAddDays, getYear } from "date-fns";

/**
 * Returns the current date/time.
 * @returns {Date} The current Date instance.
 */
export function now(): Date
{
	return new Date();
}

/**
 * Returns the current year as a number.
 * @returns {number} The current four-digit year.
 */
export function currentYear(): number
{
	return getYear(new Date());
}

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
