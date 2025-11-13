import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import {
	NotificationService,
	NotificationLevel,
	type Notification
} from "@core/services";

/**
 * Toast notification component that displays notifications from NotificationService.
 * Supports error details, copy-to-clipboard functionality, and manual dismissal.
 */
@Component({
	selector: "app-notification-toast",
	imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
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
	styles: [
		`
			.toast-container {
				position: fixed;
				top: 80px;
				right: 16px;
				z-index: 1000;
				display: flex;
				flex-direction: column;
				gap: 8px;
				pointer-events: none;
			}

			.toast {
				margin: 0;
				padding: 12px;
				border-radius: 4px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
				min-width: 300px;
				max-width: 500px;
				pointer-events: auto;
				animation: slideIn 0.3s ease-out;
			}

			@keyframes slideIn {
				from {
					transform: translateX(100%);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}

			.toast-header {
				display: flex;
				align-items: center;
				gap: 8px;
			}

			.toast-message {
				flex: 1;
				font-weight: 500;
			}

			.toast-actions {
				display: flex;
				gap: 4px;
			}

			.toast-details {
				margin-top: 8px;
				padding-top: 8px;
				border-top: 1px solid rgba(255, 255, 255, 0.3);
			}

			.toast-details ul {
				margin: 0;
				padding-left: 20px;
				font-size: 0.875rem;
			}

			.toast-error {
				background: #f44336;
				color: white;
			}

			.toast-warning {
				background: #ff9800;
				color: white;
			}

			.toast-info {
				background: #2196f3;
				color: white;
			}

			.toast-success {
				background: #4caf50;
				color: white;
			}

			/* Responsive design */
			@media (max-width: 768px) {
				.toast-container {
					right: 8px;
					left: 8px;
					top: 64px;
				}

				.toast {
					min-width: auto;
					max-width: 100%;
				}
			}
		`
	]
})
export class NotificationToastComponent
{
	protected readonly notificationService = inject(NotificationService);

	/**
	 * Get the appropriate icon for the notification level.
	 */
	getIcon(level: NotificationLevel): string
	{
		switch (level)
		{
			case NotificationLevel.Error:
				return "error";
			case NotificationLevel.Warning:
				return "warning";
			case NotificationLevel.Info:
				return "info";
			case NotificationLevel.Success:
				return "check_circle";
			default:
				return "info";
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
