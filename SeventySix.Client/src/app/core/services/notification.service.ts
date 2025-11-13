import { Injectable, signal } from "@angular/core";

/**
 * Notification severity levels.
 */
export enum NotificationLevel
{
	Success = "success",
	Info = "info",
	Warning = "warning",
	Error = "error"
}

/**
 * Notification message structure.
 */
export interface Notification
{
	id: string;
	level: NotificationLevel;
	message: string;
	duration: number;
	details?: string[];
	copyData?: string;
}

/**
 * Notification service for displaying user-facing messages.
 * Uses signals for reactive state management.
 * Follows Single Responsibility Principle (SRP).
 */
@Injectable({
	providedIn: "root"
})
export class NotificationService
{
	private readonly notifications = signal<Notification[]>([]);
	private idCounter = 0;

	/**
	 * Read-only signal of current notifications.
	 */
	readonly notifications$ = this.notifications.asReadonly();

	/**
	 * Shows a success notification.
	 */
	success(message: string, duration = 5000): void
	{
		this.show(NotificationLevel.Success, message, duration);
	}

	/**
	 * Shows an info notification.
	 */
	info(message: string, duration = 5000): void
	{
		this.show(NotificationLevel.Info, message, duration);
	}

	/**
	 * Shows a warning notification.
	 */
	warning(message: string, duration = 7000): void
	{
		this.show(NotificationLevel.Warning, message, duration);
	}

	/**
	 * Shows an error notification.
	 */
	error(message: string, duration = 10000): void
	{
		this.show(NotificationLevel.Error, message, duration);
	}

	/**
	 * Removes a notification by ID.
	 */
	dismiss(id: string): void
	{
		this.notifications.update((current) =>
			current.filter((n) => n.id !== id)
		);
	}

	/**
	 * Clears all notifications.
	 */
	clearAll(): void
	{
		this.notifications.set([]);
	}

	/**
	 * Shows an error notification with optional details and copy data.
	 */
	errorWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration?: number
	): void
	{
		this.showWithDetails(
			NotificationLevel.Error,
			message,
			details,
			copyData,
			duration
		);
	}

	/**
	 * Copies notification data to the clipboard.
	 */
	async copyToClipboard(notification: Notification): Promise<boolean>
	{
		if (!notification.copyData)
		{
			return false;
		}

		try
		{
			await navigator.clipboard.writeText(notification.copyData);
			return true;
		}
		catch (error)
		{
			console.error("Failed to copy error details to clipboard:", error);
			return false;
		}
	}

	/**
	 * Core notification display logic.
	 */
	private show(
		level: NotificationLevel,
		message: string,
		duration?: number
	): void
	{
		this.showWithDetails(level, message, undefined, undefined, duration);
	}

	/**
	 * Core notification display logic with details and copy data.
	 */
	private showWithDetails(
		level: NotificationLevel,
		message: string,
		details?: string[],
		copyData?: string,
		duration?: number
	): void
	{
		const notification: Notification = {
			id: `notification-${++this.idCounter}`,
			level,
			message,
			duration: duration ?? 0,
			details,
			copyData
		};

		this.notifications.update((current) => [...current, notification]);

		// Auto-dismiss if duration is set
		if (duration)
		{
			setTimeout(() =>
			{
				this.dismiss(notification.id);
			}, duration);
		}
	}
}
