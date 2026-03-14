/**
 * Game HUD Overlay Component.
 * Displays score, lives, weapon, nuke status, boss health, and game state overlays.
 * Positioned absolutely over the Babylon.js canvas.
 * Domain-scoped — used only within the Galactic Assault game page.
 */

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	inject,
	type Signal,
	signal,
	type WritableSignal
} from "@angular/core";
import {
	GameState,
	WeaponType
} from "@sandbox/models/game.models";
import { GameStateService } from "@sandbox/services/game-state.service";
import { ScoringService } from "@sandbox/services/scoring.service";

/**
 * Weapon display label map.
 * @type {Record<WeaponType, string>}
 */
const WEAPON_LABELS: Record<WeaponType, string> =
	{
		[WeaponType.MachineGun]: "MACHINE GUN",
		[WeaponType.SpreadGun]: "SPREAD",
		[WeaponType.Laser]: "LASER",
		[WeaponType.RapidFire]: "RAPID FIRE"
	};

/**
 * HUD overlay component for the Galactic Assault game.
 * Renders score, lives, weapon indicator, nuke status, boss health bar,
 * and contextual overlays for Title, Pause, GameOver, and Victory states.
 */
@Component(
	{
		selector: "app-game-hud",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		templateUrl: "./game-hud.html",
		styleUrl: "./game-hud.scss"
	})
export class GameHudComponent
{
	/**
	 * Scoring service for score, lives, and high score signals.
	 * @type {ScoringService}
	 * @private
	 */
	private readonly scoringService: ScoringService =
		inject(ScoringService);

	/**
	 * Game state service for current state signal.
	 * @type {GameStateService}
	 * @private
	 */
	private readonly gameStateService: GameStateService =
		inject(GameStateService);

	/**
	 * Current weapon type displayed in the HUD.
	 * @type {WritableSignal<WeaponType>}
	 */
	readonly currentWeapon: WritableSignal<WeaponType> =
		signal(WeaponType.MachineGun);

	/**
	 * Whether the player has a nuke available.
	 * @type {WritableSignal<boolean>}
	 */
	readonly hasNuke: WritableSignal<boolean> =
		signal(false);

	/**
	 * Whether a boss fight is currently active.
	 * @type {WritableSignal<boolean>}
	 */
	readonly bossActive: WritableSignal<boolean> =
		signal(false);

	/**
	 * Number of boss eyes remaining.
	 * @type {WritableSignal<number>}
	 */
	readonly bossEyesRemaining: WritableSignal<number> =
		signal(0);

	/**
	 * Total number of boss eyes at spawn.
	 * @type {WritableSignal<number>}
	 */
	readonly bossEyesTotal: WritableSignal<number> =
		signal(10);

	/**
	 * Current player score.
	 * @type {Signal<number>}
	 */
	readonly score: Signal<number> =
		this.scoringService.score;

	/**
	 * Current player lives.
	 * @type {Signal<number>}
	 */
	readonly lives: Signal<number> =
		this.scoringService.lives;

	/**
	 * Current high score.
	 * @type {Signal<number>}
	 */
	readonly highScore: Signal<number> =
		this.scoringService.highScore;

	/**
	 * Current game state.
	 * @type {Signal<GameState>}
	 */
	readonly gameState: Signal<GameState> =
		this.gameStateService.currentState;

	/**
	 * Whether the title overlay should be visible.
	 * @type {Signal<boolean>}
	 */
	readonly isTitle: Signal<boolean> =
		computed(
			() =>
				this.gameState() === GameState.Title);

	/**
	 * Whether the pause overlay should be visible.
	 * @type {Signal<boolean>}
	 */
	readonly isPaused: Signal<boolean> =
		computed(
			() =>
				this.gameState() === GameState.Paused);

	/**
	 * Whether the game over overlay should be visible.
	 * @type {Signal<boolean>}
	 */
	readonly isGameOver: Signal<boolean> =
		computed(
			() =>
				this.gameState() === GameState.GameOver);

	/**
	 * Whether the victory overlay should be visible.
	 * @type {Signal<boolean>}
	 */
	readonly isVictory: Signal<boolean> =
		computed(
			() =>
				this.gameState() === GameState.Victory);

	/**
	 * Whether the game is in active play (showing in-game HUD).
	 * @type {Signal<boolean>}
	 */
	readonly isPlaying: Signal<boolean> =
		computed(
			() =>
				this.gameState() === GameState.Playing
					|| this.gameState() === GameState.Paused);

	/**
	 * Display label for the current weapon.
	 * @type {Signal<string>}
	 */
	readonly weaponLabel: Signal<string> =
		computed(
			() =>
				WEAPON_LABELS[this.currentWeapon()]);

	/**
	 * Boss health bar percentage (0–100).
	 * @type {Signal<number>}
	 */
	readonly bossHealthPercent: Signal<number> =
		computed(
			() =>
			{
				const total: number =
					this.bossEyesTotal();

				if (total === 0)
				{
					return 0;
				}

				return Math.round(
					(this.bossEyesRemaining() / total) * 100);
			});
}