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
		styleUrl: "./session-warning.component.scss",
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