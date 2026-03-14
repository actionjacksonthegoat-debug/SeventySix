/**
 * Scoring Service.
 * Manages score, lives, high score persistence, and free life thresholds.
 * Uses Angular signals for reactive state management.
 * Domain-scoped service — must be provided via route providers array.
 */

import {
	Injectable,
	signal,
	type WritableSignal
} from "@angular/core";
import {
	FREE_LIFE_THRESHOLD,
	PLAYER_STARTING_LIVES
} from "@sandbox/constants/game.constants";

/**
 * LocalStorage key for persisting the high score.
 * @type {string}
 */
const HIGH_SCORE_KEY: string = "galacticAssault_highScore";

/**
 * Service responsible for tracking score, lives, and high score persistence.
 */
@Injectable()
export class ScoringService
{
	/**
	 * Current player score.
	 * @type {WritableSignal<number>}
	 */
	readonly score: WritableSignal<number> =
		signal(0);

	/**
	 * Remaining player lives.
	 * @type {WritableSignal<number>}
	 */
	readonly lives: WritableSignal<number> =
		signal(PLAYER_STARTING_LIVES);

	/**
	 * Highest recorded score.
	 * @type {WritableSignal<number>}
	 */
	readonly highScore: WritableSignal<number> =
		signal(this.loadHighScore());

	/**
	 * Number of free life thresholds already awarded.
	 * @type {number}
	 * @private
	 */
	private freeLifeThresholdsAwarded: number = 0;

	/**
	 * Adds points to the current score and checks for free life thresholds.
	 * @param {number} points
	 * Points to add.
	 */
	addScore(points: number): void
	{
		const newScore: number =
			this.score() + points;

		this.score.set(newScore);

		if (newScore > this.highScore())
		{
			this.highScore.set(newScore);
		}

		this.checkFreeLife(newScore);
	}

	/**
	 * Decrements lives by one.
	 * @returns {boolean}
	 * True if the player has no lives remaining (game over).
	 */
	loseLife(): boolean
	{
		const remaining: number =
			this.lives() - 1;

		this.lives.set(
			Math.max(
				0,
				remaining));

		return remaining <= 0;
	}

	/**
	 * Grants the player an extra life.
	 */
	gainLife(): void
	{
		this.lives.set(this.lives() + 1);
	}

	/**
	 * Resets score and lives for a continue. Preserves high score.
	 */
	resetForContinue(): void
	{
		this.score.set(0);
		this.lives.set(PLAYER_STARTING_LIVES);
		this.freeLifeThresholdsAwarded = 0;
	}

	/**
	 * Fully resets all scoring state.
	 */
	resetFull(): void
	{
		this.score.set(0);
		this.lives.set(PLAYER_STARTING_LIVES);
		this.highScore.set(0);
		this.freeLifeThresholdsAwarded = 0;
	}

	/**
	 * Persists the current high score to localStorage.
	 */
	saveHighScore(): void
	{
		localStorage.setItem(
			HIGH_SCORE_KEY,
			this
				.highScore()
				.toString());
	}

	/**
	 * Checks whether a free life threshold has been crossed.
	 * @param {number} currentScore
	 * The current total score.
	 * @private
	 */
	private checkFreeLife(currentScore: number): void
	{
		const thresholdsCrossed: number =
			Math.floor(currentScore / FREE_LIFE_THRESHOLD);

		if (thresholdsCrossed > this.freeLifeThresholdsAwarded)
		{
			const livesToGrant: number =
				thresholdsCrossed - this.freeLifeThresholdsAwarded;

			for (let idx: number = 0; idx < livesToGrant; idx++)
			{
				this.gainLife();
			}

			this.freeLifeThresholdsAwarded = thresholdsCrossed;
		}
	}

	/**
	 * Loads the persisted high score from localStorage.
	 * @returns {number}
	 * The stored high score or 0 if not found.
	 * @private
	 */
	private loadHighScore(): number
	{
		const stored: string | null =
			localStorage.getItem(HIGH_SCORE_KEY);

		if (stored === null)
		{
			return 0;
		}

		const parsed: number =
			parseInt(
				stored,
				10);

		return isNaN(parsed) ? 0 : parsed;
	}
}