/**
 * Race State Service.
 * Manages the race lifecycle state machine and exposes driving telemetry signals.
 */

import { computed, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { CharacterType, RaceState } from "@games/car-a-lot/models/car-a-lot.models";
import { CountdownHelper, CountdownTickResult } from "@games/shared/utilities/countdown.utility";
import { formatTimerValue } from "@games/shared/utilities/timer-display.utility";

/** Valid state transitions in the race lifecycle. */
const VALID_TRANSITIONS: ReadonlyMap<RaceState, readonly RaceState[]> =
	new Map(
		[
			[RaceState.Countdown, [RaceState.Racing]],
			[RaceState.Racing, [RaceState.OctopusPhase, RaceState.GameOver]],
			[RaceState.OctopusPhase, [RaceState.Rescue, RaceState.OctopusAttack, RaceState.GameOver]],
			[RaceState.OctopusAttack, [RaceState.GameOver]],
			[RaceState.Rescue, [RaceState.Victory, RaceState.GameOver]],
			[RaceState.Victory, [RaceState.Countdown]],
			[RaceState.GameOver, [RaceState.Countdown]]
		]);

/**
 * Manages race state transitions, speed, elapsed time, and contextual messages.
 * Domain-scoped — provided via route providers array, not as a root singleton.
 */
@Injectable()
export class RaceStateService
{
	/** Current race state signal. */
	private readonly _currentState: WritableSignal<RaceState> =
		signal(RaceState.Countdown);

	/** Current speed in mph. */
	private readonly _currentSpeed: WritableSignal<number> =
		signal(0);

	/** Elapsed race time in seconds. */
	private readonly _elapsedTime: WritableSignal<number> =
		signal(0);

	/** Selected character type for rescue message. */
	private readonly _characterType: WritableSignal<CharacterType> =
		signal(CharacterType.Princess);

	/** Countdown remaining seconds (3, 2, 1) or -1 when not active. */
	private readonly _countdownValue: WritableSignal<number> =
		signal(-1);

	/** Reusable countdown timer for pre-race sequence. */
	private readonly countdown: CountdownHelper =
		new CountdownHelper(3);

	/** Read-only signal for current race state. */
	readonly currentState: Signal<RaceState> =
		this._currentState.asReadonly();

	/** Read-only signal for current speed. */
	readonly currentSpeed: Signal<number> =
		this._currentSpeed.asReadonly();

	/** Read-only signal for elapsed time. */
	readonly elapsedTime: Signal<number> =
		this._elapsedTime.asReadonly();

	/** Read-only signal for the countdown value (-1 = not started, 3/2/1 = counting). */
	readonly countdownValue: Signal<number> =
		this._countdownValue.asReadonly();

	/**
	 * Countdown display text.
	 * Shows "GET READY!" before countdown starts, then 3/2/1, then "GO!".
	 */
	readonly countdownText: Signal<string> =
		computed(
			() =>
			{
				const value: number =
					this._countdownValue();

				if (value < 0)
				{
					return "GET READY!";
				}

				if (value === 0)
				{
					return "GO!";
				}

				return value.toString();
			});

	/** Computed signal for the rescue character name (opposite of driver). */
	readonly rescueCharacterName: Signal<string> =
		computed(
			() =>
				this._characterType() === CharacterType.Princess
					? "Prince"
					: "Princess");

	/** Computed signal for formatted final race time. */
	readonly finalTime: Signal<string> =
		computed(
			() =>
				formatTimerValue(this._elapsedTime()));

	/**
	 * Contextual rescue message based on race state and character.
	 * @returns
	 * Message string for the HUD overlay, or empty string when not applicable.
	 */
	rescueMessage(): string
	{
		const state: RaceState =
			this._currentState();
		const rescuedCharacter: string =
			this.rescueCharacterName();

		if (state === RaceState.OctopusPhase)
		{
			return `Jump over the Octopus to rescue the ${rescuedCharacter}!`;
		}

		if (state === RaceState.Rescue)
		{
			return "Drive to the victory circle!";
		}

		if (state === RaceState.Victory)
		{
			return `${rescuedCharacter} rescued! You win!`;
		}

		if (state === RaceState.GameOver)
		{
			return "You missed the road! Game Over";
		}

		return "";
	}

	/**
	 * Begin the pre-race countdown from 3.
	 * Called when the Start Game button is clicked.
	 */
	startCountdown(): void
	{
		this.countdown.reset();
		this._countdownValue.set(3);
	}

	/**
	 * Tick the countdown timer.
	 * Decrements the countdown each second. Returns true when countdown finishes at 0.
	 * @param deltaSeconds
	 * Frame delta time in seconds.
	 * @returns
	 * True if the countdown just reached zero (transition to Racing).
	 */
	tickCountdown(deltaSeconds: number): boolean
	{
		if (this._countdownValue() <= 0)
		{
			return false;
		}

		const result: CountdownTickResult =
			this.countdown.update(deltaSeconds);

		if (result.valueChanged)
		{
			this._countdownValue.set(this.countdown.currentValue);
		}

		return result.completed;
	}

	/**
	 * Check whether the countdown is currently active (3, 2, or 1).
	 * @returns
	 * True if actively counting down.
	 */
	isCountdownActive(): boolean
	{
		return this._countdownValue() > 0;
	}

	/**
	 * Attempt to transition to a new race state.
	 * Invalid transitions are silently ignored.
	 * @param nextState
	 * The target state to transition to.
	 */
	transitionTo(nextState: RaceState): void
	{
		const current: RaceState =
			this._currentState();

		const validTargets: readonly RaceState[] | undefined =
			VALID_TRANSITIONS.get(current);

		if (isValidTransition(validTargets, nextState))
		{
			this._currentState.set(nextState);
		}
	}

	/**
	 * Update the current speed display value.
	 * @param speedMph
	 * Speed in miles per hour.
	 */
	updateSpeed(speedMph: number): void
	{
		this._currentSpeed.set(speedMph);
	}

	/**
	 * Accumulate elapsed race time.
	 * @param deltaSeconds
	 * Time increment in seconds.
	 */
	updateElapsedTime(deltaSeconds: number): void
	{
		this._elapsedTime.update(
			(current) => current + deltaSeconds);
	}

	/**
	 * Set the character type for rescue messaging.
	 * @param characterType
	 * The selected character.
	 */
	setCharacterType(characterType: CharacterType): void
	{
		this._characterType.set(characterType);
	}

	/**
	 * Gets the currently selected character type.
	 * @returns The active CharacterType.
	 */
	characterType(): CharacterType
	{
		return this._characterType();
	}

	/**
	 * Reset all state back to initial values for a new race.
	 */
	reset(): void
	{
		this._currentState.set(RaceState.Countdown);
		this._currentSpeed.set(0);
		this._elapsedTime.set(0);
		this._countdownValue.set(-1);
		this.countdown.reset();
	}
}

/**
 * Check if a transition to the target state is valid.
 * @param validTargets
 * Array of valid target states, or undefined.
 * @param nextState
 * The target state.
 * @returns
 * True if the transition is valid.
 */
function isValidTransition(
	validTargets: readonly RaceState[] | undefined,
	nextState: RaceState): boolean
{
	return validTargets?.includes(nextState) ?? false;
}