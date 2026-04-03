/**
 * Shared date utility functions.
 * All date operations in commerce apps should use these functions
 * instead of native Date constructors.
 */

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
	return new Date()
		.getFullYear();
}

/**
 * Returns a date that is the specified number of seconds in the future.
 * @param seconds - Number of seconds to add to the current time.
 * @returns {Date} A new Date object offset by the given seconds.
 */
export function futureDate(seconds: number): Date
{
	const date: Date =
		new Date();
	date.setSeconds(date.getSeconds() + seconds);
	return date;
}