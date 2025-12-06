import { Injectable, signal, WritableSignal, Signal } from "@angular/core";

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
	private readonly successDurationMs: number = 5000;
	private readonly infoDurationMs: number = 5000;
	private readonly warningDurationMs: number = 7000;
	private readonly errorDurationMs: number = 10000;

	private readonly notifications: WritableSignal<Notification[]> = signal<
		Notification[]
	>([]);
	private idCounter: number = 0;

	/**
	 * Read-only signal of current notifications.
	 */
	readonly notifications$: Signal<Notification[]> =
		this.notifications.asReadonly();

	/**
	 * Shows a success notification.
	 */
	success(message: string, duration: number = this.successDurationMs): void
	{
		this.showWithDetails(
			NotificationLevel.Success,
			message,
			undefined,
			undefined,
			duration
		);
	}

	/**
	 * Shows a success notification with details.
	 */
	successWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = this.successDurationMs
	): void
	{
		this.showWithDetails(
			NotificationLevel.Success,
			message,
			details,
			copyData,
			duration
		);
	}

	/**
	 * Shows an info notification.
	 */
	info(message: string, duration: number = this.infoDurationMs): void
	{
		this.showWithDetails(
			NotificationLevel.Info,
			message,
			undefined,
			undefined,
			duration
		);
	}

	/**
	 * Shows an info notification with details.
	 */
	infoWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = this.infoDurationMs
	): void
	{
		this.showWithDetails(
			NotificationLevel.Info,
			message,
			details,
			copyData,
			duration
		);
	}

	/**
	 * Shows a warning notification.
	 */
	warning(message: string, duration: number = this.warningDurationMs): void
	{
		this.showWithDetails(
			NotificationLevel.Warning,
			message,
			undefined,
			undefined,
			duration
		);
	}

	/**
	 * Shows a warning notification with details.
	 */
	warningWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = this.warningDurationMs
	): void
	{
		this.showWithDetails(
			NotificationLevel.Warning,
			message,
			details,
			copyData,
			duration
		);
	}

	/**
	 * Shows an error notification.
	 */
	error(message: string, duration: number = this.errorDurationMs): void
	{
		this.showWithDetails(
			NotificationLevel.Error,
			message,
			undefined,
			undefined,
			duration
		);
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
		duration: number = this.errorDurationMs
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
	 * Copies notification data to the clipboard and logs to console.
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

			// eslint-disable-next-line no-console
			console.info(
				"Notification copied to clipboard:",
				notification.copyData
			);

			return true;
		}
		catch (error)
		{
			console.error("Failed to copy error details to clipboard:", error);
			return false;
		}
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
