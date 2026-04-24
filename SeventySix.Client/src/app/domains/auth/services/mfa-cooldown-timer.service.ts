/**
 * Route-scoped countdown timer service for MFA resend cooldown.
 * Encapsulates interval-based countdown logic with reactive signals.
 * Must be provided in route providers — not root-level.
 */

import { DestroyRef, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { interval, Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

/**
 * Route-scoped service that manages a countdown timer.
 * Exposes remaining seconds as a reactive signal and fires an observable
 * when the countdown completes.
 */
@Injectable()
export class MfaCooldownTimerService
{
	/**
	 * Angular destroy reference for automatic subscription cleanup.
	 * @type {DestroyRef}
	 * @private
	 * @readonly
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Subject used to stop the active interval subscription.
	 * @type {Subject<void>}
	 * @private
	 * @readonly
	 */
	private readonly stopSubject: Subject<void> =
		new Subject<void>();

	/**
	 * Subject that emits when the countdown reaches zero.
	 * @type {Subject<void>}
	 * @private
	 * @readonly
	 */
	private readonly completedSubject: Subject<void> =
		new Subject<void>();

	/**
	 * Internal writable signal backing {@link remainingSeconds}.
	 * @type {WritableSignal<number>}
	 * @private
	 * @readonly
	 */
	private readonly _remainingSeconds: WritableSignal<number> =
		signal<number>(0);

	/**
	 * Internal writable signal backing {@link isActive}.
	 * @type {WritableSignal<boolean>}
	 * @private
	 * @readonly
	 */
	private readonly _isActive: WritableSignal<boolean> =
		signal<boolean>(false);

	/**
	 * Read-only signal of the number of seconds remaining in the countdown.
	 * Emits 0 when no countdown is active.
	 * @type {Signal<number>}
	 * @readonly
	 */
	readonly remainingSeconds: Signal<number> =
		this._remainingSeconds.asReadonly();

	/**
	 * Read-only signal indicating whether a countdown is currently running.
	 * @type {Signal<boolean>}
	 * @readonly
	 */
	readonly isActive: Signal<boolean> =
		this._isActive.asReadonly();

	/**
	 * Observable that emits once when the countdown reaches zero.
	 * @type {Observable<void>}
	 * @readonly
	 */
	readonly completed: Observable<void> =
		this.completedSubject.asObservable();

	/**
	 * Starts a countdown from the specified duration in seconds.
	 * If a countdown is already active it is cancelled and restarted.
	 *
	 * @param {number} durationSeconds
	 * The countdown duration in whole seconds.
	 */
	start(durationSeconds: number): void
	{
		this.stopSubject.next();
		this._remainingSeconds.set(durationSeconds);
		this._isActive.set(true);

		interval(1000)
			.pipe(
				takeUntil(this.stopSubject),
				takeUntilDestroyed(this.destroyRef))
			.subscribe(
				() =>
				{
					const remaining: number =
						this._remainingSeconds() - 1;

					if (remaining <= 0)
					{
						this._remainingSeconds.set(0);
						this._isActive.set(false);
						this.completedSubject.next();
						this.stopSubject.next();
					}
					else
					{
						this._remainingSeconds.set(remaining);
					}
				});
	}

	/**
	 * Stops the active countdown immediately and resets state.
	 * Has no effect when no countdown is active.
	 */
	stop(): void
	{
		this.stopSubject.next();
		this._remainingSeconds.set(0);
		this._isActive.set(false);
	}
}