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
 * Notification system configuration.
 * Controls visibility and batching behavior.
 */
export const NOTIFICATION_CONFIG: Readonly<{ maxVisible: number; }> =
	{
		maxVisible: 5
	} as const;

/**
 * Duration constants for notification display times in milliseconds.
 * Used by NotificationService to control auto-dismiss timing.
 */
export const NOTIFICATION_DURATION: Readonly<{
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

/**
 * Type representing valid notification duration keys.
 */
export type NotificationDurationType = keyof typeof NOTIFICATION_DURATION;
