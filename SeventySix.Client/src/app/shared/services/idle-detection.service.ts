import { DOCUMENT } from "@angular/common";
import {
	DestroyRef,
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { DateService } from "@shared/services/date.service";

/**
 * Detects user inactivity via DOM interaction events.
 * Provides idle/warning signals consumed by AuthService and SessionWarningComponent.
 *
 * Design:
 * - Checks idle state every 15s (battery-friendly)
 * - Countdown (1s) only starts when entering warning phase
 * - `visibilitychange` handles tab-away / screen-lock
 * - Server-driven config (timeoutMinutes, warningSeconds from auth response)
 */
@Injectable(
	{
		providedIn: "root"
	})
export class IdleDetectionService
{
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	private readonly document: Document =
		inject(DOCUMENT);

	private readonly dateService: DateService =
		inject(DateService);

	// Signals (private writable, public readonly)
	private readonly idleSignal: WritableSignal<boolean> =
		signal(false);

	private readonly warningSignal: WritableSignal<boolean> =
		signal(false);

	private readonly remainingSecondsSignal: WritableSignal<number> =
		signal(0);

	/**
	 * Whether the user has exceeded the inactivity timeout.
	 * @type {Signal<boolean>}
	 */
	readonly isIdle: Signal<boolean> =
		this.idleSignal.asReadonly();

	/**
	 * Whether the warning countdown is active.
	 * @type {Signal<boolean>}
	 */
	readonly isWarning: Signal<boolean> =
		this.warningSignal.asReadonly();

	/**
	 * Seconds remaining before idle timeout (only meaningful when isWarning).
	 * @type {Signal<number>}
	 */
	readonly remainingSeconds: Signal<number> =
		this.remainingSecondsSignal.asReadonly();

	private timeoutMs: number = 0;
	private warningMs: number = 0;
	private lastActivityTimestamp: number = 0;
	private countdownInterval: ReturnType<typeof setInterval> | null = null;
	private checkInterval: ReturnType<typeof setInterval> | null = null;

	/** User activity events to track (covers all input methods). */
	private readonly activityEvents: readonly string[] =
		[
			"mousedown",
			"keydown",
			"touchstart",
			"scroll",
			"pointermove"
		];

	/**
	 * Starts idle detection with server-provided configuration.
	 *
	 * @param {number} timeoutMinutes
	 * Inactivity timeout in minutes.
	 *
	 * @param {number} warningSeconds
	 * Seconds before timeout to show warning.
	 */
	start(
		timeoutMinutes: number,
		warningSeconds: number): void
	{
		this.stop();

		this.timeoutMs =
			timeoutMinutes * 60 * 1000;
		this.warningMs =
			warningSeconds * 1000;
		this.lastActivityTimestamp =
			this.dateService.nowTimestamp();

		this.activityEvents.forEach(
			(eventName: string) =>
			{
				this.document.addEventListener(
					eventName,
					this.onActivity,
					{ passive: true });
			});

		this.document.addEventListener(
			"visibilitychange",
			this.onVisibilityChange);

		// Check idle state every 15 seconds (battery-friendly)
		this.checkInterval =
			setInterval(
				() => this.checkIdleState(),
				15_000);

		this.destroyRef.onDestroy(
			() => this.stop());
	}

	/**
	 * Resets the idle timer. Called for immediate visual feedback
	 * when user clicks "Stay signed in" on the warning.
	 */
	resetTimer(): void
	{
		this.lastActivityTimestamp =
			this.dateService.nowTimestamp();
		this.warningSignal.set(false);
		this.idleSignal.set(false);
		this.stopCountdown();
	}

	/**
	 * Stops idle detection and cleans up all listeners and timers.
	 */
	stop(): void
	{
		this.activityEvents.forEach(
			(eventName: string) =>
			{
				this.document.removeEventListener(
					eventName,
					this.onActivity);
			});

		this.document.removeEventListener(
			"visibilitychange",
			this.onVisibilityChange);

		this.stopCountdown();

		if (this.checkInterval !== null)
		{
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}

		this.idleSignal.set(false);
		this.warningSignal.set(false);
		this.remainingSecondsSignal.set(0);
	}

	/**
	 * Arrow function to preserve `this` binding in event listener.
	 * Resets activity timestamp on any user interaction.
	 */
	private readonly onActivity: () => void =
		(): void =>
		{
			this.lastActivityTimestamp =
				this.dateService.nowTimestamp();

			if (this.isWarning())
			{
				this.warningSignal.set(false);
				this.stopCountdown();
			}
		};

	/**
	 * Handles tab becoming visible again — immediately checks idle state
	 * instead of waiting for the next 15s interval.
	 */
	private readonly onVisibilityChange: () => void =
		(): void =>
		{
			if (this.document.visibilityState === "visible")
			{
				this.checkIdleState();
			}
		};

	/**
	 * Evaluates elapsed idle time and transitions to warning or idle state.
	 */
	private checkIdleState(): void
	{
		const now: number =
			this.dateService.nowTimestamp();
		const elapsedMs: number =
			now - this.lastActivityTimestamp;
		const remainingMs: number =
			this.timeoutMs - elapsedMs;

		if (remainingMs <= 0)
		{
			this.stop();
			this.idleSignal.set(true);
			return;
		}

		if (remainingMs <= this.warningMs && !this.isWarning())
		{
			this.warningSignal.set(true);
			this.startCountdown(remainingMs);
		}
	}

	/**
	 * Begins the 1-second countdown interval for the warning phase.
	 *
	 * @param {number} remainingMs
	 * Milliseconds remaining before timeout.
	 */
	private startCountdown(remainingMs: number): void
	{
		this.remainingSecondsSignal.set(
			Math.ceil(remainingMs / 1000));
		this.stopCountdown();

		this.countdownInterval =
			setInterval(
				() =>
				{
					const seconds: number =
						this.remainingSeconds() - 1;
					this.remainingSecondsSignal.set(
						Math.max(0, seconds));

					if (seconds <= 0)
					{
						this.stopCountdown();
					}
				},
				1000);
	}

	/**
	 * Clears the countdown interval.
	 */
	private stopCountdown(): void
	{
		if (this.countdownInterval !== null)
		{
			clearInterval(this.countdownInterval);
			this.countdownInterval = null;
		}
	}
}