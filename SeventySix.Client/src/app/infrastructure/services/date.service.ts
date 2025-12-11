import { Injectable } from "@angular/core";
import { isNullOrUndefined } from "@infrastructure/utils/null-check.utility";
import {
	format,
	formatDistanceToNow,
	parseISO,
	isValid as isValidDate,
	isBefore as isBeforeDate,
	isAfter as isAfterDate,
	isSameDay as isSameDayDate,
	addDays as addDaysUtil,
	addHours as addHoursUtil,
	differenceInDays as differenceInDaysUtil,
	startOfDay,
	endOfDay
} from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/**
 * Centralized date handling service for SeventySix application.
 *
 * Design Philosophy:
 * - All server communication uses UTC (ISO 8601 strings)
 * - All user display uses local timezone
 * - All date operations are immutable (date-fns guarantee)
 * - Single source of truth for date logic (DRY principle)
 *
 * Usage:
 * - API calls: Use toUTC() to convert Date to ISO string
 * - Display: Use formatLocal() or Angular DatePipe
 * - Calculations: Use provided utilities (addDays, differenceInDays, etc.)
 */
@Injectable({
	providedIn: "root"
})
export class DateService
{
	private readonly UTC_ZONE: string = "UTC";

	// ========================================
	// UTC OPERATIONS (Server Communication)
	// ========================================

	/**
	 * Get current time as UTC ISO string.
	 * Use for API requests that need current timestamp.
	 *
	 * @returns ISO 8601 string in UTC (e.g., "2024-04-29T19:45:12.123Z")
	 *
	 * @example
	 * const payload = { clientTimestamp: this.dateService.now() };
	 */
	now(): string
	{
		return new Date().toISOString();
	}

	/**
	 * Get current timestamp as milliseconds since epoch.
	 * Use for internal timing (circuit breakers, rate limiting, performance tracking).
	 *
	 * @returns Milliseconds since Unix epoch
	 *
	 * @example
	 * this.circuitBreakerOpenTime = this.dateService.nowTimestamp();
	 */
	nowTimestamp(): number
	{
		return Date.now();
	}

	/**
	 * Convert Date object to UTC ISO string.
	 * Use when sending dates to API.
	 *
	 * @param date - Date object to convert
	 * @returns ISO 8601 string in UTC
	 *
	 * @example
	 * const isoString = this.dateService.toUTC(myDate);
	 * this.http.post('/api/logs', { timestamp: isoString });
	 */
	toUTC(date: Date): string
	{
		return formatInTimeZone(
			date,
			this.UTC_ZONE,
			"yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
		);
	}

	/**
	 * Parse ISO string to Date object (treats as UTC).
	 * Use when receiving dates from API.
	 *
	 * @param isoString - ISO 8601 string
	 * @returns Date object (interpreted as UTC)
	 *
	 * @example
	 * const log = response.data;
	 * const timestamp = this.dateService.parseUTC(log.timestamp);
	 */
	parseUTC(isoString: string): Date
	{
		return parseISO(isoString);
	}

	// ========================================
	// LOCAL OPERATIONS (User Display)
	// ========================================

	/**
	 * Format date in user's local timezone.
	 *
	 * @param date - Date to format
	 * @param formatString - date-fns format string (default: 'PPpp')
	 * @returns Formatted string in local timezone
	 *
	 * Common formats:
	 * - 'PPpp': Apr 29, 2024, 3:45:12 PM
	 * - 'PP': Apr 29, 2024
	 * - 'p': 3:45 PM
	 * - 'yyyy-MM-dd': 2024-04-29
	 * - 'HH:mm:ss': 15:45:12
	 *
	 * @example
	 * const formatted = this.dateService.formatLocal(log.timestamp, 'PPpp');
	 */
	formatLocal(date: Date | string, formatString = "PPpp"): string
	{
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		return format(parsedDate, formatString);
	}

	/**
	 * Format date as relative time ("5 mins ago", "2 days ago").
	 * Use for "Last Called" columns, activity timestamps.
	 *
	 * @param date - Date to format
	 * @returns Relative time string
	 *
	 * @example
	 * const relative = this.dateService.formatRelative(apiStat.lastCalled);
	 * // "5 minutes ago"
	 */
	formatRelative(date: Date | string): string
	{
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		return formatDistanceToNow(parsedDate, { addSuffix: true });
	}

	/**
	 * Convert UTC date to user's local timezone.
	 *
	 * @param utcDate - Date in UTC
	 * @returns Date object in local timezone
	 */
	toLocal(utcDate: Date | string): Date
	{
		const parsedDate: Date =
			typeof utcDate === "string" ? this.parseUTC(utcDate) : utcDate;
		return toZonedTime(
			parsedDate,
			Intl.DateTimeFormat().resolvedOptions().timeZone
		);
	}

	// ========================================
	// VALIDATION & COMPARISON
	// ========================================

	/**
	 * Check if date is valid.
	 *
	 * @param date - Date to validate
	 * @returns True if valid date
	 */
	isValid(date: Date | string | null | undefined): boolean
	{
		if (isNullOrUndefined(date)) return false;
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		return isValidDate(parsedDate);
	}

	/**
	 * Check if date A is before date B (UTC comparison).
	 *
	 * @param dateA - First date
	 * @param dateB - Second date
	 * @returns True if dateA < dateB
	 */
	isBefore(dateA: Date | string, dateB: Date | string): boolean
	{
		const a: Date =
			typeof dateA === "string" ? this.parseUTC(dateA) : dateA;
		const b: Date =
			typeof dateB === "string" ? this.parseUTC(dateB) : dateB;
		return isBeforeDate(a, b);
	}

	/**
	 * Check if date A is after date B (UTC comparison).
	 *
	 * @param dateA - First date
	 * @param dateB - Second date
	 * @returns True if dateA > dateB
	 */
	isAfter(dateA: Date | string, dateB: Date | string): boolean
	{
		const a: Date =
			typeof dateA === "string" ? this.parseUTC(dateA) : dateA;
		const b: Date =
			typeof dateB === "string" ? this.parseUTC(dateB) : dateB;
		return isAfterDate(a, b);
	}

	/**
	 * Check if two dates are the same calendar day (UTC).
	 *
	 * @param dateA - First date
	 * @param dateB - Second date
	 * @returns True if same day in UTC
	 */
	isSameDay(dateA: Date | string, dateB: Date | string): boolean
	{
		const a: Date =
			typeof dateA === "string" ? this.parseUTC(dateA) : dateA;
		const b: Date =
			typeof dateB === "string" ? this.parseUTC(dateB) : dateB;
		return isSameDayDate(a, b);
	}

	/**
	 * Check if date is in the past (compared to now in UTC).
	 *
	 * @param date - Date to check
	 * @returns True if date is before now
	 */
	isPast(date: Date | string): boolean
	{
		return this.isBefore(date, new Date());
	}

	/**
	 * Check if date is in the future (compared to now in UTC).
	 *
	 * @param date - Date to check
	 * @returns True if date is after now
	 */
	isFuture(date: Date | string): boolean
	{
		return this.isAfter(date, new Date());
	}

	// ========================================
	// DATE ARITHMETIC
	// ========================================

	/**
	 * Add days to a date (immutable).
	 *
	 * @param date - Starting date
	 * @param count - Number of days to add (negative to subtract)
	 * @returns New Date object
	 *
	 * @example
	 * const nextWeek = this.dateService.addDays(new Date(), 7);
	 */
	addDays(date: Date | string, count: number): Date
	{
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		return addDaysUtil(parsedDate, count);
	}

	/**
	 * Add hours to a date (immutable).
	 *
	 * @param date - Starting date
	 * @param count - Number of hours to add (negative to subtract)
	 * @returns New Date object
	 */
	addHours(date: Date | string, count: number): Date
	{
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		return addHoursUtil(parsedDate, count);
	}

	/**
	 * Calculate difference between two dates in days (UTC).
	 *
	 * @param dateA - End date
	 * @param dateB - Start date
	 * @returns Number of days between dates
	 *
	 * @example
	 * const daysSince = this.dateService.differenceInDays(new Date(), lastLogin);
	 */
	differenceInDays(dateA: Date | string, dateB: Date | string): number
	{
		const a: Date =
			typeof dateA === "string" ? this.parseUTC(dateA) : dateA;
		const b: Date =
			typeof dateB === "string" ? this.parseUTC(dateB) : dateB;
		return differenceInDaysUtil(a, b);
	}

	/**
	 * Get start of day (00:00:00.000) in UTC.
	 *
	 * @param date - Date to get start of day
	 * @returns Date at 00:00:00.000 UTC
	 */
	startOfDay(date: Date | string): Date
	{
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		const utcDate: Date = toZonedTime(parsedDate, this.UTC_ZONE);
		const startDate: Date = startOfDay(utcDate);
		return new Date(
			Date.UTC(
				startDate.getFullYear(),
				startDate.getMonth(),
				startDate.getDate(),
				0,
				0,
				0,
				0
			)
		);
	}

	/**
	 * Get end of day (23:59:59.999) in UTC.
	 *
	 * @param date - Date to get end of day
	 * @returns Date at 23:59:59.999 UTC
	 */
	endOfDay(date: Date | string): Date
	{
		const parsedDate: Date =
			typeof date === "string" ? this.parseUTC(date) : date;
		const utcDate: Date = toZonedTime(parsedDate, this.UTC_ZONE);
		const endDate: Date = endOfDay(utcDate);
		return new Date(
			Date.UTC(
				endDate.getFullYear(),
				endDate.getMonth(),
				endDate.getDate(),
				23,
				59,
				59,
				999
			)
		);
	}

	// ========================================
	// HELPERS FOR COMMON PATTERNS
	// ========================================

	/**
	 * Calculate hours since a timestamp.
	 * Useful for API status checks.
	 *
	 * @param timestamp - Past timestamp
	 * @returns Number of hours since timestamp
	 *
	 * @example
	 * const hoursSince = this.dateService.hoursSince(apiStat.lastCalled);
	 * if (hoursSince < 1) return 'ok';
	 */
	hoursSince(timestamp: Date | string): number
	{
		const parsedDate: Date =
			typeof timestamp === "string"
				? this.parseUTC(timestamp)
				: timestamp;
		const diffMs: number = new Date().getTime() - parsedDate.getTime();
		return Math.floor(diffMs / 3600000);
	}

	/**
	 * Calculate minutes since a timestamp.
	 *
	 * @param timestamp - Past timestamp
	 * @returns Number of minutes since timestamp
	 */
	minutesSince(timestamp: Date | string): number
	{
		const parsedDate: Date =
			typeof timestamp === "string"
				? this.parseUTC(timestamp)
				: timestamp;
		const diffMs: number = new Date().getTime() - parsedDate.getTime();
		return Math.floor(diffMs / 60000);
	}
}
