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
 *
 * @type {Readonly<{ maxVisible: number; }>}
 * @property {number} maxVisible - Maximum number of concurrently visible notifications.
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
 *
 * @type {Readonly<{ success: number; error: number; warning: number; info: number; concurrencyError: number; }>}
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
	/**
	 * Angular destroy reference for cleanup on service destroy.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Current notifications list signal.
	 * @type {WritableSignal<Notification[]>}
	 * @private
	 */
	private readonly notifications: WritableSignal<Notification[]> =
		signal<
			Notification[]>([]);

	/**
	 * Timers for auto-dismissal keyed by notification id.
	 * @type {Map<string, ReturnType<typeof globalThis.setTimeout>>}
	 * @private
	 */
	private readonly dismissTimers: Map<string, ReturnType<typeof globalThis.setTimeout>> =
		new Map();

	/**
	 * Incremental id counter for notifications.
	 * @type {number}
	 * @private
	 */
	private idCounter: number = 0;

	/**
	 * Initialize NotificationService and cleanup on destroy.
	 * @returns {void}
	 */
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
	 * @type {Signal<Notification[]>}
	 */
	readonly readonlyNotifications: Signal<Notification[]> =
		this.notifications.asReadonly();

	/**
	 * Shows a success notification.
	 * @param {string} message
	 * The message to display to the user.
	 * @param {number} duration
	 * Display duration in milliseconds. Defaults to success duration.
	 * @returns {void}
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
	 * Shows a success notification with additional details and optional copy data.
	 * @param {string} message
	 * The main message to display.
	 * @param {string[]} details
	 * Optional lines of detail shown to the user.
	 * @param {string} copyData
	 * Optional diagnostic data available for copy-to-clipboard.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * Shows an informational notification.
	 * @param {string} message
	 * The message to display.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * Shows an informational notification with additional details and optional copy data.
	 * @param {string} message
	 * The main message to display.
	 * @param {string[]} details
	 * Optional lines of detail shown to the user.
	 * @param {string} copyData
	 * Optional diagnostic data available for copy-to-clipboard.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * @param {string} message
	 * The message to display.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * Shows a warning notification with additional details and optional copy data.
	 * @param {string} message
	 * The main message to display.
	 * @param {string[]} details
	 * Optional lines of detail shown to the user.
	 * @param {string} copyData
	 * Optional diagnostic data available for copy-to-clipboard.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * Shows a warning notification with an action button (e.g., retry or resolve).
	 * @param {string} message
	 * The message to display.
	 * @param {string} actionLabel
	 * Label for the action button.
	 * @param {() => void} onAction
	 * Callback invoked when the user clicks the action.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * @param {string} message
	 * The message to display.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * @param {string} id
	 * The ID of the notification to remove.
	 * @returns {void}
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
	 * Clears all notifications and cancels any pending dismiss timers.
	 * @returns {void}
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
	 * @param {string} message
	 * The main message to display.
	 * @param {string[]} details
	 * Optional lines of detail shown to the user.
	 * @param {string} copyData
	 * Optional diagnostic data available for copy-to-clipboard.
	 * @param {number} duration
	 * Display duration in milliseconds.
	 * @returns {void}
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
	 * @param {Notification} notification
	 * The notification object containing data to copy.
	 * @returns {Promise<boolean>}
	 * Promise resolving to true if copy succeeded, false otherwise.
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
	 * Core notification display logic with details and optional copy data.
	 * @param {NotificationLevel} level
	 * The notification severity level.
	 * @param {string} message
	 * The message to display.
	 * @param {string[]} details
	 * Optional lines of detail shown to the user.
	 * @param {string} copyData
	 * Optional diagnostic data available for copy-to-clipboard.
	 * @param {number} duration
	 * Optional display duration in milliseconds.
	 * @returns {void}
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
	 * @param {NotificationLevel} level
	 * The notification severity level.
	 * @param {string} message
	 * The message to display.
	 * @param {string} actionLabel
	 * Label for the action button.
	 * @param {() => void} onAction
	 * Callback invoked when the action is selected.
	 * @param {number} duration
	 * Optional display duration in milliseconds.
	 * @returns {void}
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
