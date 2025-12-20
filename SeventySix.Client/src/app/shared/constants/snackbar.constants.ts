/**
 * Snackbar type constants for notification styling and duration.
 */
export enum SnackbarType
{
	Success,
	Error,
	Warning,
	Info
}

/**
 * Unified notification duration constants (milliseconds).
 * Single source of truth for all notification timing across snackbar and notification services.
 */
export const SNACKBAR_DURATION: Readonly<{
	success: number;
	error: number;
	warning: number;
	info: number;
	concurrencyError: number;
}> =
	{
		success: 3000,
		error: 5000,
		warning: 7000,
		info: 5000,
		concurrencyError: 10000
	} as const;
