// <copyright file="notification.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Notification severity levels.
 * Shared constant across domains for consistent notification handling.
 */
export enum NotificationLevel
{
	Success = "success",
	Info = "info",
	Warning = "warning",
	Error = "error"
}

/**
 * Notification duration constants in milliseconds.
 * Used by NotificationService for auto-dismiss timing.
 */
export const NOTIFICATION_DURATION: Readonly<{
	/** Success notifications auto-dismiss after 3 seconds. */
	SUCCESS: 3000;
	/** Error notifications stay longer (5 seconds) for readability. */
	ERROR: 5000;
	/** Warning notifications auto-dismiss after 4 seconds. */
	WARNING: 4000;
	/** Info notifications auto-dismiss after 3 seconds. */
	INFO: 3000;
}> =
	{
		SUCCESS: 3000,
		ERROR: 5000,
		WARNING: 4000,
		INFO: 3000
	} as const;
