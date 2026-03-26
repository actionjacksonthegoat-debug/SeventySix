// <copyright file="turn.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Turn Service.
 * Maintains the shared island self-destruct timer for Spy vs Spy.
 * Single Responsibility: countdown and penalty deductions only.
 */

import { Injectable, type Signal, signal, type WritableSignal } from "@angular/core";
import {
	DEATH_TIMER_PENALTY_SECONDS,
	GAME_TIMER_SECONDS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyIdentity, TurnPhase } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/**
 * Maintains the shared island countdown timer.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class TurnService
{
	/** Internal writable signal for island timer. */
	private readonly islandTimerWritable: WritableSignal<number> =
		signal<number>(GAME_TIMER_SECONDS);

	/** Legacy-compatible turn signal (single-player always Player1). */
	readonly currentTurn: Signal<TurnPhase> =
		signal<TurnPhase>(TurnPhase.Player1)
			.asReadonly();

	/** Legacy-compatible turn-time signal (unused in single-player mode). */
	readonly turnTimeRemaining: Signal<number> =
		signal<number>(0)
			.asReadonly();

	/** Legacy-compatible alias for island timer in seconds. */
	readonly player1Timer: Signal<number> =
		this.islandTimerWritable.asReadonly();

	/** Legacy-compatible alias for island timer in seconds. */
	readonly player2Timer: Signal<number> =
		this.islandTimerWritable.asReadonly();

	/** Shared island self-destruct timer in seconds. */
	readonly islandTimer: Signal<number> =
		this.islandTimerWritable.asReadonly();

	/**
	 * Initialize the island timer for a new game.
	 * @param gameDurationSeconds
	 * Total island self-destruct time in seconds.
	 */
	initialize(gameDurationSeconds: number = GAME_TIMER_SECONDS): void
	{
		this.islandTimerWritable.set(gameDurationSeconds);
	}

	/**
	 * Advance the island timer.
	 * @param deltaTime
	 * Elapsed time in seconds since last update.
	 */
	update(deltaTime: number): void
	{
		const newTimer: number =
			this.islandTimerWritable() - deltaTime;
		this.islandTimerWritable.set(Math.max(0, newTimer));
	}

	/**
	 * Legacy no-op for compatibility with older tests.
	 */
	switchTurn(): void
	{
		/* Single-player mode: no alternating turns. */
	}

	/**
	 * Get the active identity.
	 * @returns
	 * Always SpyIdentity.Black in single-player mode.
	 */
	getActiveIdentity(): SpyIdentity
	{
		return SpyIdentity.Black;
	}

	/**
	 * Deduct death penalty from island timer.
	 * @param identity
	 * The SpyIdentity of the player who died (unused in shared-timer mode).
	 */
	applyDeathPenalty(identity: SpyIdentity): void
	{
		void identity;
		const newTimer: number =
			this.islandTimerWritable() - DEATH_TIMER_PENALTY_SECONDS;
		this.islandTimerWritable.set(Math.max(0, newTimer));
	}

	/**
	 * Check if the island timer has expired.
	 * @param identity
	 * The SpyIdentity to check (unused in shared-timer mode).
	 * @returns
	 * True if the island timer is at or below zero.
	 */
	isTimerExpired(identity: SpyIdentity): boolean
	{
		void identity;
		return this.islandTimerWritable() <= 0;
	}

	/**
	 * Reset island timer for a new game.
	 * @param gameDurationSeconds
	 * Total island self-destruct time in seconds.
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
		this.islandTimerWritable.set(GAME_TIMER_SECONDS);
	}
}