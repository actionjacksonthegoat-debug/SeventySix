import {
	DestroyRef,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { NotificationLevel } from "@shared/constants";
import { Notification } from "@shared/models";

/**
 * Notification system configuration.
 * Private to NotificationService - implementation detail.
 */
const NOTIFICATION_CONFIG: Readonly<{
	maxVisible: number;
}> =
	{
		maxVisible: 5
	} as const;

/**
 * Notification duration constants (milliseconds).
 * Private to NotificationService - external code should not need to know about timing.
 */
const NOTIFICATION_DURATION: Readonly<{
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
 * Notification service for displaying user-facing messages.
 * Uses signals for reactive state management.
 * Follows Single Responsibility Principle (SRP).
 */
@Injectable(
	{
		providedIn: "root"
	})
export class NotificationService
{
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	private readonly notifications: WritableSignal<Notification[]> =
		signal<
			Notification[]>([]);
	private readonly dismissTimers: Map<string, ReturnType<typeof globalThis.setTimeout>> =
		new Map();
	private idCounter: number = 0;

	constructor()
	{
		this.destroyRef.onDestroy(
			() =>
			{
				this.dismissTimers.forEach(
					(timer) => clearTimeout(timer));
				this.dismissTimers.clear();
			});
	}

	/**
	 * Read-only signal of current notifications.
	 */
	readonly readonlyNotifications: Signal<Notification[]> =
		this.notifications.asReadonly();

	/**
	 * Shows a success notification.
	 */
	success(message: string, duration: number = NOTIFICATION_DURATION.success): void
	{
		this.showWithDetails(
			NotificationLevel.Success,
			message,
			undefined,
			undefined,
			duration);
	}

	/**
	 * Shows a success notification with details.
	 */
	successWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = NOTIFICATION_DURATION.success): void
	{
		this.showWithDetails(
			NotificationLevel.Success,
			message,
			details,
			copyData,
			duration);
	}

	/**
	 * Shows an info notification.
	 */
	info(message: string, duration: number = NOTIFICATION_DURATION.info): void
	{
		this.showWithDetails(
			NotificationLevel.Info,
			message,
			undefined,
			undefined,
			duration);
	}

	/**
	 * Shows an info notification with details.
	 */
	infoWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = NOTIFICATION_DURATION.info): void
	{
		this.showWithDetails(
			NotificationLevel.Info,
			message,
			details,
			copyData,
			duration);
	}

	/**
	 * Shows a warning notification.
	 */
	warning(message: string, duration: number = NOTIFICATION_DURATION.warning): void
	{
		this.showWithDetails(
			NotificationLevel.Warning,
			message,
			undefined,
			undefined,
			duration);
	}

	/**
	 * Shows a warning notification with details.
	 */
	warningWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = NOTIFICATION_DURATION.warning): void
	{
		this.showWithDetails(
			NotificationLevel.Warning,
			message,
			details,
			copyData,
			duration);
	}

	/**
	 * Shows a warning notification with an action button.
	 * Used for scenarios like concurrency errors that require user action.
	 */
	warningWithAction(
		message: string,
		actionLabel: string,
		onAction: () => void,
		duration: number = NOTIFICATION_DURATION.concurrencyError): void
	{
		this.showWithAction(
			NotificationLevel.Warning,
			message,
			actionLabel,
			onAction,
			duration);
	}

	/**
	 * Shows an error notification.
	 */
	error(message: string, duration: number = NOTIFICATION_DURATION.error): void
	{
		this.showWithDetails(
			NotificationLevel.Error,
			message,
			undefined,
			undefined,
			duration);
	}

	/**
	 * Removes a notification by ID.
	 */
	dismiss(id: string): void
	{
		const timer: ReturnType<typeof globalThis.setTimeout> | undefined =
			this.dismissTimers.get(id);
		if (timer)
		{
			clearTimeout(timer);
			this.dismissTimers.delete(id);
		}
		this.notifications.update(
			(current) =>
				current.filter(
					(notification) => notification.id !== id));
	}

	/**
	 * Clears all notifications.
	 */
	clearAll(): void
	{
		this.dismissTimers.forEach(
			(timer) => clearTimeout(timer));
		this.dismissTimers.clear();
		this.notifications.set([]);
	}

	/**
	 * Shows an error notification with optional details and copy data.
	 */
	errorWithDetails(
		message: string,
		details?: string[],
		copyData?: string,
		duration: number = NOTIFICATION_DURATION.error): void
	{
		this.showWithDetails(
			NotificationLevel.Error,
			message,
			details,
			copyData,
			duration);
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
				notification.copyData);

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
		duration?: number): void
	{
		// Enforce max visible limit - dismiss oldest notification if at capacity
		if (this.readonlyNotifications().length >= NOTIFICATION_CONFIG.maxVisible)
		{
			const oldestNotification: Notification =
				this.readonlyNotifications()[0];
			this.dismiss(oldestNotification.id);
		}

		const notification: Notification =
			{
				id: `notification-${++this.idCounter}`,
				level,
				message,
				duration: duration ?? 0,
				details,
				copyData
			};

		this.notifications.update(
			(current) => [...current, notification]);

		// Auto-dismiss if duration is set using globalThis.setTimeout
		// This is the appropriate pattern for service-level timers in Angular
		if (duration)
		{
			const timer: ReturnType<typeof globalThis.setTimeout> =
				globalThis.setTimeout(
					() =>
					{
						this.dismissTimers.delete(notification.id);
						this.dismiss(notification.id);
					},
					duration);
			this.dismissTimers.set(notification.id, timer);
		}
	}

	/**
	 * Core notification display logic with action callback.
	 */
	private showWithAction(
		level: NotificationLevel,
		message: string,
		actionLabel: string,
		onAction: () => void,
		duration?: number): void
	{
		// Enforce max visible limit - dismiss oldest notification if at capacity
		if (this.readonlyNotifications().length >= NOTIFICATION_CONFIG.maxVisible)
		{
			const oldestNotification: Notification =
				this.readonlyNotifications()[0];
			this.dismiss(oldestNotification.id);
		}

		const notification: Notification =
			{
				id: `notification-${++this.idCounter}`,
				level,
				message,
				duration: duration ?? 0,
				actionLabel,
				onAction
			};

		this.notifications.update(
			(current) => [...current, notification]);

		// Auto-dismiss if duration is set
		if (duration)
		{
			const timer: ReturnType<typeof globalThis.setTimeout> =
				globalThis.setTimeout(
					() =>
					{
						this.dismissTimers.delete(notification.id);
						this.dismiss(notification.id);
					},
					duration);
			this.dismissTimers.set(notification.id, timer);
		}
	}
}
