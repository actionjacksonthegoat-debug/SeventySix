// <copyright file="combat.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Combat Service.
 * Manages hand-to-hand combat engagement, timer, and resolution.
 * Single Responsibility: combat logic only.
 */

import { Injectable, type Signal, signal, type WritableSignal } from "@angular/core";
import {
	COMBAT_DURATION_SECONDS,
	COMBAT_ENGAGE_RADIUS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { CombatResult } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/**
 * Manages combat engagement and resolution for the Spy vs Spy game.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class CombatService
{
	/* ─── Private Writables ─────────────────────────────────────────────── */

	private readonly isInCombatWritable: WritableSignal<boolean> =
		signal(false);

	private readonly lastResultWritable: WritableSignal<CombatResult | null> =
		signal(null);

	private readonly combatTimerWritable: WritableSignal<number> =
		signal(0);

	/* ─── Public Readonly Signals ──────────────────────────────────────── */

	/** Whether combat is currently active. */
	readonly isInCombat: Signal<boolean> =
		this.isInCombatWritable.asReadonly();

	/** Combat result after resolution. */
	readonly lastResult: Signal<CombatResult | null> =
		this.lastResultWritable.asReadonly();

	/** Remaining combat timer in seconds. */
	readonly combatTimer: Signal<number> =
		this.combatTimerWritable.asReadonly();

	/**
	 * Check if combat can be initiated between two positions.
	 * @param spy1X
	 * First spy's X position.
	 * @param spy1Z
	 * First spy's Z position.
	 * @param spy2X
	 * Second spy's X position.
	 * @param spy2Z
	 * Second spy's Z position.
	 * @returns
	 * True if spies are within combat engagement radius.
	 */
	canEngage(
		spy1X: number,
		spy1Z: number,
		spy2X: number,
		spy2Z: number): boolean
	{
		const deltaX: number =
			spy1X - spy2X;
		const deltaZ: number =
			spy1Z - spy2Z;
		const distSquared: number =
			deltaX * deltaX + deltaZ * deltaZ;

		return distSquared <= COMBAT_ENGAGE_RADIUS * COMBAT_ENGAGE_RADIUS;
	}

	/**
	 * Initiate combat between two spies.
	 * Sets the combat timer and marks combat as active.
	 */
	startCombat(): void
	{
		this.isInCombatWritable.set(true);
		this.lastResultWritable.set(null);
		this.combatTimerWritable.set(COMBAT_DURATION_SECONDS);
	}

	/**
	 * Update combat timer each frame.
	 * @param deltaTime
	 * Elapsed time in seconds since last update.
	 * @returns
	 * True if combat just finished (timer expired).
	 */
	update(deltaTime: number): boolean
	{
		if (!this.isInCombatWritable())
		{
			return false;
		}

		const newTimer: number =
			Math.max(0, this.combatTimerWritable() - deltaTime);
		this.combatTimerWritable.set(newTimer);

		if (newTimer <= 0)
		{
			return true;
		}

		return false;
	}

	/**
	 * Resolve combat via dice roll — 50/50 chance for each player.
	 * @returns
	 * Combat result indicating the winner.
	 */
	resolve(): CombatResult
	{
		const player1Wins: boolean =
			Math.random() < 0.5;
		const result: CombatResult =
			player1Wins
				? CombatResult.Player1Wins
				: CombatResult.Player2Wins;

		this.lastResultWritable.set(result);
		this.isInCombatWritable.set(false);
		this.combatTimerWritable.set(0);

		return result;
	}

	/**
	 * Reset combat state for a new game.
	 */
	reset(): void
	{
		this.isInCombatWritable.set(false);
		this.lastResultWritable.set(null);
		this.combatTimerWritable.set(0);
	}

	/**
	 * Dispose and clear all combat state.
	 */
	dispose(): void
	{
		this.reset();
	}
}