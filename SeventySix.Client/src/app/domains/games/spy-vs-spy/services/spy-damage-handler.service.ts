// <copyright file="spy-damage-handler.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { inject, Injectable } from "@angular/core";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import {
	BOMB_STUN_SECONDS,
	SPRING_STUN_SECONDS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	CombatResult,
	SpyIdentity,
	StunState,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { CombatService } from "@games/spy-vs-spy/services/combat.service";
import { SpyAiService } from "@games/spy-vs-spy/services/spy-ai.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";
import { SpyBuilderService } from "@games/spy-vs-spy/services/spy-builder.service";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";
import { TurnService } from "@games/spy-vs-spy/services/turn.service";

/**
 * Handles stun application, death/stun visual effects, and combat resolution
 * for the Spy vs Spy game. Extracted from SpyFlowService to isolate damage
 * and visual effect logic into a single-responsibility service.
 *
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyDamageHandlerService
{
	/** Spy visual builder for death/stun animations. */
	private readonly spyBuilder: SpyBuilderService =
		inject(SpyBuilderService);

	/** Player physics service for setting stun state. */
	private readonly spyPhysics: SpyPhysicsService =
		inject(SpyPhysicsService);

	/** AI service for setting AI stun state. */
	private readonly spyAi: SpyAiService =
		inject(SpyAiService);

	/** Turn management service for death penalties. */
	private readonly turnService: TurnService =
		inject(TurnService);

	/** Combat resolution service. */
	private readonly combatService: CombatService =
		inject(CombatService);

	/** Audio feedback service for damage sounds. */
	private readonly audioService: SpyAudioService =
		inject(SpyAudioService);

	/** Babylon.js scene reference for visual effects. */
	private sceneRef: Scene | null = null;

	/** Player 1 (Black spy) TransformNode for visual effects. */
	private player1Node: TransformNode | null = null;

	/** Player 2 (White spy / AI) TransformNode for visual effects. */
	private player2Node: TransformNode | null = null;

	/**
	 * Stores scene and spy node references for death/stun visual effects.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param blackSpyNode
	 * Player 1 (Black) TransformNode.
	 * @param whiteSpyNode
	 * Player 2 (White / AI) TransformNode.
	 */
	public initializeVisuals(
		scene: Scene,
		blackSpyNode: TransformNode,
		whiteSpyNode: TransformNode): void
	{
		this.sceneRef = scene;
		this.player1Node = blackSpyNode;
		this.player2Node = whiteSpyNode;
	}

	/**
	 * Applies trap stun, turn penalty, audio, and visual effects to the specified spy.
	 * The caller is responsible for handling item drops and life loss for bomb traps.
	 * @param trapType
	 * The type of trap triggered.
	 * @param isPlayer1
	 * Whether the affected spy is player 1 (Black).
	 * @returns True if the trap was a bomb (caller should handle item drop and life loss).
	 */
	public applyTrapToSpy(
		trapType: TrapType,
		isPlayer1: boolean): boolean
	{
		const stunState: StunState =
			trapType === TrapType.Bomb
				? StunState.BombStunned
				: StunState.SpringLaunched;
		const stunDuration: number =
			trapType === TrapType.Bomb
				? BOMB_STUN_SECONDS
				: SPRING_STUN_SECONDS;
		const identity: SpyIdentity =
			isPlayer1 ? SpyIdentity.Black : SpyIdentity.White;

		if (isPlayer1)
		{
			this.spyPhysics.setStunned(stunState, stunDuration);
		}
		else
		{
			this.spyAi.setStunned(stunState, stunDuration);
		}

		this.turnService.applyDeathPenalty(identity);
		this.triggerStunVisual(isPlayer1, stunDuration);

		if (trapType === TrapType.Bomb)
		{
			this.triggerDeathVisual(isPlayer1);
			this.audioService.playBombTriggered();
			return true;
		}

		this.audioService.playSpringTriggered();
		return false;
	}

	/**
	 * Resolves combat using dice-roll resolution and applies stun to the loser.
	 * The caller is responsible for updating life signals and showing notifications.
	 * @returns The combat result indicating which player won.
	 */
	public resolveCombat(): CombatResult
	{
		const result: CombatResult =
			this.combatService.resolve();

		this.audioService.playCombatHit();

		if (result === CombatResult.Player1Wins)
		{
			this.spyAi.setStunned(
				StunState.BombStunned,
				BOMB_STUN_SECONDS);
			this.triggerStunVisual(false, BOMB_STUN_SECONDS);
			this.turnService.applyDeathPenalty(SpyIdentity.White);
		}
		else
		{
			this.spyPhysics.setStunned(
				StunState.BombStunned,
				BOMB_STUN_SECONDS);
			this.triggerStunVisual(true, BOMB_STUN_SECONDS);
			this.turnService.applyDeathPenalty(SpyIdentity.Black);
		}

		return result;
	}

	/**
	 * Triggers the cartoon death animation on a spy node (bomb trap).
	 * Fire-and-forget — animation resolves asynchronously.
	 * @param isPlayer1
	 * Whether the affected spy is player 1 (Black).
	 */
	public triggerDeathVisual(isPlayer1: boolean): void
	{
		const node: TransformNode | null =
			isPlayer1 ? this.player1Node : this.player2Node;

		if (node == null || this.sceneRef == null)
		{
			return;
		}

		void this.spyBuilder.playDeathAnimation(
			node,
			this.sceneRef);
	}

	/**
	 * Shows stun star effect on a spy node and auto-hides after duration.
	 * @param isPlayer1
	 * Whether the affected spy is player 1 (Black).
	 * @param durationSeconds
	 * Duration in seconds before hiding stun stars.
	 */
	public triggerStunVisual(
		isPlayer1: boolean,
		durationSeconds: number): void
	{
		const node: TransformNode | null =
			isPlayer1 ? this.player1Node : this.player2Node;

		if (node == null || this.sceneRef == null)
		{
			return;
		}

		this.spyBuilder.showStunEffect(node, this.sceneRef);

		setTimeout(
			(): void =>
			{
				this.spyBuilder.hideStunEffect(node);
			},
			durationSeconds * 1000);
	}
}