import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { IdleDetectionService } from "@shared/services/idle-detection.service";

/**
 * Compact bottom-right overlay showing a live countdown before session expiry.
 * Self-manages visibility via `idleDetectionService.isWarning()`.
 */
@Component(
	{
		selector: "app-session-warning",
		standalone: true,
		imports: [
			MatButtonModule,
			MatIconModule
		],
		changeDetection: ChangeDetectionStrategy.OnPush,
		template: `
			@if (idleDetectionService.isWarning())
			{
				<div class="session-warning"
					role="alert"
					aria-live="assertive"
					aria-atomic="true">
					<mat-icon aria-hidden="true">
						schedule
					</mat-icon>
					<div class="warning-content">
						<span class="warning-text">
							Session expires in
						</span>
						<span class="countdown"
							aria-label="seconds remaining">
							{{ idleDetectionService.remainingSeconds() }}s
						</span>
					</div>
					<button mat-icon-button
						aria-label="Stay signed in"
						(click)="extendSession()">
						<mat-icon aria-hidden="true">
							refresh
						</mat-icon>
					</button>
				</div>
			}
		`,
		styles: `
			.session-warning
			{
				position: fixed;
				bottom: 24px;
				right: 24px;
				z-index: 1000;
				display: flex;
				align-items: center;
				gap: 12px;
				padding: 12px 16px;
				border-radius: 12px;
				background-color: var(--mat-sys-error-container);
				color: var(--mat-sys-on-error-container);
				box-shadow: var(--mat-sys-elevation-3);
				animation: slideIn 200ms ease-out;
			}

			.countdown
			{
				font-weight: 700;
				font-size: 1.25rem;
				font-variant-numeric: tabular-nums;
				min-width: 3ch;
				text-align: center;
			}

			@keyframes slideIn
			{
				from
				{
					transform: translateY(20px);
					opacity: 0;
				}
				to
				{
					transform: translateY(0);
					opacity: 1;
				}
			}
		`,
		host: {
			"class": "session-warning-host"
		}
	})
export class SessionWarningComponent
{
	/**
	 * Idle detection service for warning state and countdown.
	 * @type {IdleDetectionService}
	 */
	readonly idleDetectionService: IdleDetectionService =
		inject(IdleDetectionService);

	/**
	 * Extends the session by resetting the idle timer.
	 * The click itself is also a DOM activity event, so the timer resets automatically,
	 * but explicit reset provides immediate visual feedback.
	 * @returns {void}
	 */
	extendSession(): void
	{
		this.idleDetectionService.resetTimer();
	}
}
