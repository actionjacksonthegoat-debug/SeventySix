// <copyright file="notification.model.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { NotificationLevel } from "@shared/constants";

/**
 * Notification message structure.
 * Used by NotificationService and NotificationToastComponent.
 */
export interface Notification
{
	/**
	 * Unique identifier for the notification.
	 * @type {string}
	 */
	id: string;

	/**
	 * Notification severity level.
	 * @type {NotificationLevel}
	 */
	level: NotificationLevel;

	/**
	 * Primary message text to display.
	 * @type {string}
	 */
	message: string;

	/**
	 * Optional duration in milliseconds for auto-dismissal.
	 * @type {number | undefined}
	 */
	duration?: number;

	/**
	 * Optional lines of additional detail to show in a details panel.
	 * @type {string[] | undefined}
	 */
	details?: string[];

	/**
	 * Optional diagnostic data available for copy-to-clipboard.
	 * @type {string | undefined}
	 */
	copyData?: string;

	/**
	 * Optional label for action button (e.g., 'Retry').
	 * @type {string | undefined}
	 */
	actionLabel?: string;

	/**
	 * Optional callback invoked when action button is clicked.
	 * @type {() => void | undefined}
	 */
	onAction?: () => void;
}
