/**
 * Shared date utility functions.
 * All date operations in commerce apps should use these functions
 * instead of native Date constructors.
 */
import { addSeconds, getYear } from "date-fns";

/**
 * Returns the current date/time.
 * This is the ONLY function allowed to use `new Date()` directly.
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
	return getYear(now());
}

/**
 * Returns a date that is the specified number of seconds in the future.
 * @param seconds - Number of seconds to add to the current time.
 * @returns {Date} A new Date object offset by the given seconds.
 */
export function futureDate(seconds: number): Date
{
	return addSeconds(now(), seconds);
}
