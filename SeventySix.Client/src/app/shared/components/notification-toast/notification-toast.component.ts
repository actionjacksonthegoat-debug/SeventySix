import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { NotificationLevel } from "@shared/constants";
import { Notification } from "@shared/models";
import { NotificationService } from "@shared/services";

/**
 * Map of notification levels to their corresponding Material icons.
 * @type {ReadonlyMap<NotificationLevel, string>}
 */
const NOTIFICATION_ICONS: ReadonlyMap<NotificationLevel, string> =
	new Map<NotificationLevel, string>(
		[
			[NotificationLevel.Error, "cancel"],
			[NotificationLevel.Warning, "warning"],
			[NotificationLevel.Info, "lightbulb"],
			[NotificationLevel.Success, "check_circle"]
		]);

/**
 * Default icon when notification level is unknown.
 * @type {string}
 */
const DEFAULT_ICON: string = "lightbulb";

/**
 * Toast notification component that displays notifications from NotificationService.
 * Supports error details, copy-to-clipboard functionality, and manual dismissal.
 */
@Component(
	{
		selector: "app-notification-toast",
		imports: [MatIconModule, MatButtonModule, MatTooltipModule],
		changeDetection: ChangeDetectionStrategy.OnPush,
		template: `
		<div class="toast-container" role="region" aria-label="Notifications">
			@for (
				notification of notificationService.readonlyNotifications();
				track notification.id
			) {
				<div
					class="toast toast-{{ notification.level }}"
					role="alert"
					[attr.aria-live]="
						notification.level === 'error' ? 'assertive' : 'polite'
					"
				>
					<div class="toast-header">
						<mat-icon>{{ getIcon(notification.level) }}</mat-icon>
						<span class="toast-message">{{
							notification.message
						}}</span>
						<div class="toast-actions">
							@if (notification.actionLabel && notification.onAction) {
								<button
									mat-stroked-button
									class="action-button"
									(click)="executeAction(notification)"
									[attr.aria-label]="notification.actionLabel"
								>
									{{ notification.actionLabel }}
								</button>
							}
							@if (notification.copyData) {
								<button
									mat-icon-button
									(click)="copyToClipboard(notification)"
									matTooltip="Copy error details"
									aria-label="Copy error details"
								>
									<mat-icon aria-hidden="true">content_copy</mat-icon>
								</button>
							}
							<button
								mat-icon-button
								(click)="dismiss(notification.id)"
								matTooltip="Dismiss"
								aria-label="Dismiss"
							>
								<mat-icon aria-hidden="true">close</mat-icon>
							</button>
						</div>
					</div>

					@if (
						notification.details && notification.details.length > 0
					) {
						<div class="toast-details">
							<ul>
								@for (
									detail of notification.details;
									track detail
								) {
									<li>{{ detail }}</li>
								}
							</ul>
						</div>
					}
				</div>
			}
		</div>
	`,
		styleUrl: "./notification-toast.component.scss"
	})
export class NotificationToastComponent
{
	/**
	 * NotificationService instance for reading and acting on notifications.
	 * @type {NotificationService}
	 * @protected
	 * @readonly
	 */
	protected readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Get the appropriate icon name for the specified notification level.
	 *
	 * @param {NotificationLevel} level
	 * The notification severity level.
	 * @returns {string}
	 * Material icon name to render for the given level.
	 */
	getIcon(level: NotificationLevel): string
	{
		return NOTIFICATION_ICONS.get(level) ?? DEFAULT_ICON;
	}

	/**
	 * Dismiss a notification by ID.
	 *
	 * @param {string} id
	 * The notification id to dismiss.
	 * @returns {void}
	 */
	dismiss(id: string): void
	{
		this.notificationService.dismiss(id);
	}

	/**
	 * Execute the notification action and dismiss the notification.
	 *
	 * @param {Notification} notification
	 * The notification containing the action to execute.
	 * @returns {void}
	 */
	executeAction(notification: Notification): void
	{
		if (notification.onAction)
		{
			notification.onAction();
		}
		this.dismiss(notification.id);
	}

	/**
	 * Copy notification data to the clipboard using the service helper.
	 *
	 * @param {Notification} notification
	 * The notification whose `copyData` will be copied.
	 * @returns {Promise<void>}
	 */
	async copyToClipboard(notification: Notification): Promise<void>
	{
		await this.notificationService.copyToClipboard(notification);
	}
}
