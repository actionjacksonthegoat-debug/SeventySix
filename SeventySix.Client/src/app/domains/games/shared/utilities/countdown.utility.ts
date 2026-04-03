/**
 * Countdown Helper Utility.
 * Reusable countdown timer for game modes (pre-race, pre-match, etc.).
 * Counts down from a configurable duration, ticking once per second.
 * Detects value changes and completion for audio/visual cue synchronization.
 */

/** Result of a countdown update tick. */
export interface CountdownTickResult
{
	/** Whether the displayed countdown value changed this frame. */
	valueChanged: boolean;

	/** Whether the countdown just reached zero (completed) this frame. */
	completed: boolean;
}

/**
 * Countdown timer that decrements an integer value once per second.
 * Supports reset for replaying sequences and exposes current state.
 */
export class CountdownHelper
{
	/** Total countdown duration in seconds. */
	private readonly duration: number;

	/** Accumulated fractional time since the last whole-second tick. */
	private accumulator: number = 0;

	/** Current countdown value (duration → 0). */
	private value: number;

	/** Whether the countdown has finished (reached zero). */
	private complete: boolean = false;

	/**
	 * Creates a new countdown timer.
	 * @param durationSeconds
	 * Number of whole seconds to count down from (e.g., 3 for a "3, 2, 1, GO!" sequence).
	 */
	constructor(durationSeconds: number)
	{
		this.duration = durationSeconds;
		this.value = durationSeconds;
	}

	/**
	 * Current displayed countdown value (duration down to 0).
	 */
	get currentValue(): number
	{
		return this.value;
	}

	/**
	 * Accumulated elapsed time in seconds since the countdown started or was last reset.
	 */
	get elapsed(): number
	{
		return (this.duration - this.value) + this.accumulator;
	}

	/**
	 * Remaining time in seconds (fractional).
	 */
	get remaining(): number
	{
		return Math.max(0, this.value - this.accumulator);
	}

	/**
	 * Whether the countdown has reached zero.
	 */
	get isComplete(): boolean
	{
		return this.complete;
	}

	/**
	 * Advances the countdown by the given delta time.
	 * Returns whether the displayed value changed and/or the countdown completed.
	 * Handles multi-second deltas correctly (e.g., lag spikes or test scenarios).
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @returns
	 * Tick result indicating value change and/or completion.
	 */
	update(deltaTime: number): CountdownTickResult
	{
		if (this.complete)
		{
			return { valueChanged: false, completed: false };
		}

		this.accumulator += deltaTime;

		const ticks: number =
			Math.floor(this.accumulator);

		if (ticks < 1)
		{
			return { valueChanged: false, completed: false };
		}

		this.accumulator -= ticks;

		const previousValue: number =
			this.value;
		this.value =
			Math.max(0, this.value - ticks);

		if (this.value <= 0)
		{
			this.value = 0;
			this.complete = true;

			return { valueChanged: true, completed: true };
		}

		const changed: boolean =
			this.value !== previousValue;

		return { valueChanged: changed, completed: false };
	}

	/**
	 * Resets the countdown to its initial duration.
	 * Used when restarting a game without re-creating the helper.
	 */
	reset(): void
	{
		this.value =
			this.duration;
		this.accumulator = 0;
		this.complete = false;
	}
}