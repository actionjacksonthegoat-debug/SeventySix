import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
	type Notification,
	NotificationLevel,
	NotificationService
} from "@shared/services";

/**
 * Toast notification component that displays notifications from NotificationService.
 * Supports error details, copy-to-clipboard functionality, and manual dismissal.
 */
@Component(
	{
		selector: "app-notification-toast",
		imports: [MatIconModule, MatButtonModule, MatTooltipModule],
		template: `
		<div class="toast-container" role="region" aria-label="Notifications">
			@for (
				notification of notificationService.notifications$();
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
							@if (notification.copyData) {
								<button
									mat-icon-button
									(click)="copyToClipboard(notification)"
									matTooltip="Copy error details"
									aria-label="Copy error details"
								>
									<mat-icon>content_copy</mat-icon>
								</button>
							}
							<button
								mat-icon-button
								(click)="dismiss(notification.id)"
								matTooltip="Dismiss"
								aria-label="Dismiss"
							>
								<mat-icon>close</mat-icon>
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
	protected readonly notificationService: NotificationService =
		inject(NotificationService);

	/**
	 * Get the appropriate icon for the notification level.
	 */
	getIcon(level: NotificationLevel): string
	{
		switch (level)
		{
			case NotificationLevel.Error:
				return "cancel";
			case NotificationLevel.Warning:
				return "warning";
			case NotificationLevel.Info:
				return "lightbulb";
			case NotificationLevel.Success:
				return "check_circle";
			default:
				return "lightbulb";
		}
	}

	/**
	 * Dismiss a notification by ID.
	 */
	dismiss(id: string): void
	{
		this.notificationService.dismiss(id);
	}

	/**
	 * Copy notification data to clipboard.
	 */
	async copyToClipboard(notification: Notification): Promise<void>
	{
		await this.notificationService.copyToClipboard(notification);
	}
}
