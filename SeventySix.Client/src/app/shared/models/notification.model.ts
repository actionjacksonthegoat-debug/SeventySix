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
	id: string;
	level: NotificationLevel;
	message: string;
	duration: number;
	details?: string[];
	copyData?: string;
	actionLabel?: string;
	onAction?: () => void;
}
