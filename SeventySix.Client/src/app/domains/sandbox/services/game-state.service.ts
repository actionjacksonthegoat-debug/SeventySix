/**
 * Game State Service.
 * Manages the game state machine with validated transitions.
 * Uses Angular signals for reactive state updates.
 * Domain-scoped service — must be provided via route providers array.
 */

import {
	Injectable,
	signal,
	type WritableSignal
} from "@angular/core";
import { GameState } from "@sandbox/models/game.models";

/**
 * Valid state transition map.
 * Keys are current states, values are arrays of valid target states.
 * @type {Map<GameState, GameState[]>}
 */
const VALID_TRANSITIONS: Map<GameState, GameState[]> =
	new Map<GameState, GameState[]>(
		[
			[GameState.Title, [GameState.Playing]],
			[GameState.Playing, [GameState.Paused, GameState.GameOver, GameState.Victory]],
			[GameState.Paused, [GameState.Playing]],
			[GameState.GameOver, [GameState.Playing]],
			[GameState.Victory, [GameState.Title]]
		]);

/**
 * Service responsible for managing game state transitions.
 * Validates all transitions against the allowed state machine graph.
 */
@Injectable()
export class GameStateService
{
	/**
	 * Current game state as a reactive signal.
	 * @type {WritableSignal<GameState>}
	 */
	readonly currentState: WritableSignal<GameState> =
		signal(GameState.Title);

	/**
	 * Attempts a state transition. Returns false if the transition is invalid.
	 * @param {GameState} target
	 * The target state to transition to.
	 * @returns {boolean}
	 * True if the transition was valid and applied.
	 */
	transition(target: GameState): boolean
	{
		const current: GameState =
			this.currentState();
		const validTargets: GameState[] | undefined =
			VALID_TRANSITIONS.get(current);

		if (validTargets === undefined || !validTargets.includes(target))
		{
			return false;
		}

		this.currentState.set(target);
		return true;
	}

	/**
	 * Transitions from Title to Playing.
	 */
	start(): void
	{
		this.transition(GameState.Playing);
	}

	/**
	 * Toggles between Playing and Paused states.
	 */
	pause(): void
	{
		const current: GameState =
			this.currentState();

		if (current === GameState.Playing)
		{
			this.transition(GameState.Paused);
		}
		else if (current === GameState.Paused)
		{
			this.transition(GameState.Playing);
		}
	}

	/**
	 * Transitions from Playing to GameOver.
	 */
	gameOver(): void
	{
		this.transition(GameState.GameOver);
	}

	/**
	 * Transitions from Playing to Victory.
	 */
	victory(): void
	{
		this.transition(GameState.Victory);
	}

	/**
	 * Transitions from GameOver to Playing (continue).
	 */
	continueGame(): void
	{
		this.transition(GameState.Playing);
	}

	/**
	 * Resets the state machine to Title.
	 */
	reset(): void
	{
		this.currentState.set(GameState.Title);
	}
}