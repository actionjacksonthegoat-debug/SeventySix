// <copyright file="turn.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Turn Service.
 * Manages two-player turn alternation and personal timers for Spy vs Spy.
 * Single Responsibility: turn timing and switching only.
 */

import { Injectable, type Signal, signal, type WritableSignal } from "@angular/core";
import {
	DEATH_TIMER_PENALTY_SECONDS,
	GAME_TIMER_SECONDS,
	TURN_DURATION_SECONDS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyIdentity, TurnPhase } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/**
 * Manages two-player turn-based alternation and personal countdown timers.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class TurnService
{
	/** Internal writable signal for current turn phase. */
	private readonly currentTurnWritable: WritableSignal<TurnPhase> =
		signal<TurnPhase>(TurnPhase.Player1);

	/** Internal writable signal for turn time remaining. */
	private readonly turnTimeWritable: WritableSignal<number> =
		signal<number>(TURN_DURATION_SECONDS);

	/** Internal writable signal for player 1 timer. */
	private readonly player1TimerWritable: WritableSignal<number> =
		signal<number>(GAME_TIMER_SECONDS);

	/** Internal writable signal for player 2 timer. */
	private readonly player2TimerWritable: WritableSignal<number> =
		signal<number>(GAME_TIMER_SECONDS);

	/** Whose turn it currently is. */
	readonly currentTurn: Signal<TurnPhase> =
		this.currentTurnWritable.asReadonly();

	/** Seconds remaining in the current turn. */
	readonly turnTimeRemaining: Signal<number> =
		this.turnTimeWritable.asReadonly();

	/** Player 1 (Black Spy) personal timer in seconds. */
	readonly player1Timer: Signal<number> =
		this.player1TimerWritable.asReadonly();

	/** Player 2 (White Spy) personal timer in seconds. */
	readonly player2Timer: Signal<number> =
		this.player2TimerWritable.asReadonly();

	/**
	 * Initialize all timers for a new game.
	 * @param gameDurationSeconds
	 * Total game time per player (default: GAME_TIMER_SECONDS).
	 */
	initialize(gameDurationSeconds: number = GAME_TIMER_SECONDS): void
	{
		this.currentTurnWritable.set(TurnPhase.Player1);
		this.turnTimeWritable.set(TURN_DURATION_SECONDS);
		this.player1TimerWritable.set(gameDurationSeconds);
		this.player2TimerWritable.set(gameDurationSeconds);
	}

	/**
	 * Advance turn timer and active player's personal timer.
	 * Auto-switches turn when the turn timer expires.
	 * @param deltaTime
	 * Elapsed time in seconds since last update.
	 */
	update(deltaTime: number): void
	{
		const remaining: number =
			this.turnTimeWritable() - deltaTime;

		if (remaining <= 0)
		{
			this.switchTurn();
			return;
		}

		this.turnTimeWritable.set(remaining);

		/* Deduct from active player's personal timer. */
		if (this.currentTurnWritable() === TurnPhase.Player1)
		{
			const newTimer: number =
				this.player1TimerWritable() - deltaTime;
			this.player1TimerWritable.set(
				Math.max(0, newTimer));
		}
		else
		{
			const newTimer: number =
				this.player2TimerWritable() - deltaTime;
			this.player2TimerWritable.set(
				Math.max(0, newTimer));
		}
	}

	/**
	 * Force switch to the other player's turn.
	 * Resets the turn timer.
	 */
	switchTurn(): void
	{
		const nextTurn: TurnPhase =
			this.currentTurnWritable() === TurnPhase.Player1
				? TurnPhase.Player2
				: TurnPhase.Player1;

		this.currentTurnWritable.set(nextTurn);
		this.turnTimeWritable.set(TURN_DURATION_SECONDS);
	}

	/**
	 * Get the SpyIdentity of the currently active player.
	 * @returns
	 * SpyIdentity.Black for Player1, SpyIdentity.White for Player2.
	 */
	getActiveIdentity(): SpyIdentity
	{
		return this.currentTurnWritable() === TurnPhase.Player1
			? SpyIdentity.Black
			: SpyIdentity.White;
	}

	/**
	 * Deduct death penalty from a player's personal timer.
	 * @param identity
	 * The SpyIdentity of the player who died.
	 */
	applyDeathPenalty(identity: SpyIdentity): void
	{
		if (identity === SpyIdentity.Black)
		{
			const newTimer: number =
				this.player1TimerWritable() - DEATH_TIMER_PENALTY_SECONDS;
			this.player1TimerWritable.set(
				Math.max(0, newTimer));
		}
		else
		{
			const newTimer: number =
				this.player2TimerWritable() - DEATH_TIMER_PENALTY_SECONDS;
			this.player2TimerWritable.set(
				Math.max(0, newTimer));
		}
	}

	/**
	 * Check if a player's personal timer has expired.
	 * @param identity
	 * The SpyIdentity to check.
	 * @returns
	 * True if the player's timer is at or below zero.
	 */
	isTimerExpired(identity: SpyIdentity): boolean
	{
		if (identity === SpyIdentity.Black)
		{
			return this.player1TimerWritable() <= 0;
		}

		return this.player2TimerWritable() <= 0;
	}

	/**
	 * Reset all timers for a new game.
	 * @param gameDurationSeconds
	 * Total game time per player.
	 */
	reset(gameDurationSeconds: number = GAME_TIMER_SECONDS): void
	{
		this.initialize(gameDurationSeconds);
	}

	/**
	 * Dispose and clear references.
	 */
	dispose(): void
	{
		this.currentTurnWritable.set(TurnPhase.Player1);
		this.turnTimeWritable.set(TURN_DURATION_SECONDS);
		this.player1TimerWritable.set(GAME_TIMER_SECONDS);
		this.player2TimerWritable.set(GAME_TIMER_SECONDS);
	}
}