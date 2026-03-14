/**
 * Galactic Assault game page component.
 * Smart container that hosts the Babylon.js canvas, HUD overlay, and manages game lifecycle.
 * Wires all game services together: scene, player, enemies, weapons, power-ups,
 * boss, scoring, audio, state machine, and particle effects.
 */

import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	inject,
	type Signal,
	viewChild
} from "@angular/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observer } from "@babylonjs/core/Misc/observable";
import { Scene } from "@babylonjs/core/scene";
import { BabylonCanvasComponent } from "@sandbox/components/babylon-canvas/babylon-canvas";
import { GameHudComponent } from "@sandbox/components/game-hud/game-hud";
import {
	BOSS_POINTS,
	PLAYER_INVINCIBILITY_DURATION
} from "@sandbox/constants/game.constants";
import {
	type CollisionFrameContext,
	type CollisionFrameResult,
	GameState,
	PowerUpType,
	type Projectile,
	WeaponType
} from "@sandbox/models/game.models";
import { BossService } from "@sandbox/services/boss.service";
import { EnemySwarmService } from "@sandbox/services/enemy-swarm.service";
import { GameAudioService } from "@sandbox/services/game-audio.service";
import { GameCollisionHandlerService } from "@sandbox/services/game-collision-handler.service";
import { GameSceneService } from "@sandbox/services/game-scene.service";
import { GameStateService } from "@sandbox/services/game-state.service";
import { InputService } from "@sandbox/services/input.service";
import { ParticleEffectsService } from "@sandbox/services/particle-effects.service";
import { PlayerShipService } from "@sandbox/services/player-ship.service";
import { PowerUpService } from "@sandbox/services/powerup.service";
import { ScoringService } from "@sandbox/services/scoring.service";
import { WeaponService } from "@sandbox/services/weapon.service";

/**
 * Page component for the Galactic Assault 3D space shooter game.
 * Hosts the Babylon.js canvas wrapper and coordinates all game services.
 */
@Component(
	{
		selector: "app-galactic-assault",
		standalone: true,
		changeDetection: ChangeDetectionStrategy.OnPush,
		imports: [BabylonCanvasComponent, GameHudComponent],
		templateUrl: "./galactic-assault.html",
		styleUrl: "./galactic-assault.scss"
	})
export class GalacticAssaultComponent
{
	/**
	 * Game scene environment service.
	 * @type {GameSceneService}
	 * @private
	 */
	private readonly gameSceneService: GameSceneService =
		inject(GameSceneService);

	/**
	 * Player ship creation and flight physics service.
	 * @type {PlayerShipService}
	 * @private
	 */
	private readonly playerShipService: PlayerShipService =
		inject(PlayerShipService);

	/**
	 * Keyboard input polling service.
	 * @type {InputService}
	 * @private
	 */
	private readonly inputService: InputService =
		inject(InputService);

	/**
	 * Collision registration and response handler service.
	 * @type {GameCollisionHandlerService}
	 * @private
	 */
	private readonly collisionHandler: GameCollisionHandlerService =
		inject(GameCollisionHandlerService);

	/**
	 * Weapon firing and projectile management service.
	 * @type {WeaponService}
	 * @private
	 */
	private readonly weaponService: WeaponService =
		inject(WeaponService);

	/**
	 * Beholder boss creation and behavior service.
	 * @type {BossService}
	 * @private
	 */
	private readonly bossService: BossService =
		inject(BossService);

	/**
	 * Score, lives, and high score management service.
	 * @type {ScoringService}
	 * @private
	 */
	private readonly scoringService: ScoringService =
		inject(ScoringService);

	/**
	 * Procedural audio synthesis service.
	 * @type {GameAudioService}
	 * @private
	 */
	private readonly audioService: GameAudioService =
		inject(GameAudioService);

	/**
	 * Game state machine service.
	 * @type {GameStateService}
	 * @private
	 */
	private readonly gameStateService: GameStateService =
		inject(GameStateService);

	/**
	 * Particle effects service for explosions and impacts.
	 * @type {ParticleEffectsService}
	 * @private
	 */
	private readonly particleEffectsService: ParticleEffectsService =
		inject(ParticleEffectsService);

	/**
	 * Enemy wave spawning and movement service.
	 * @type {EnemySwarmService}
	 * @private
	 */
	private readonly enemySwarmService: EnemySwarmService =
		inject(EnemySwarmService);

	/**
	 * Power-up spawning and collection service.
	 * @type {PowerUpService}
	 * @private
	 */
	private readonly powerUpService: PowerUpService =
		inject(PowerUpService);

	/**
	 * Destroy ref for cleanup registration.
	 * @type {DestroyRef}
	 * @private
	 */
	private readonly destroyRef: DestroyRef =
		inject(DestroyRef);

	/**
	 * Reference to the HUD component for updating weapon/nuke/boss state.
	 * @type {Signal<GameHudComponent>}
	 * @private
	 */
	private readonly hudComponent: Signal<GameHudComponent> =
		viewChild.required(GameHudComponent);

	/** Reference to the player ship transform node. */
	private playerShip: TransformNode | null = null;

	/** Reference to the game loop observer for cleanup. */
	private gameLoopObserver: Observer<Scene> | null = null;

	/** Current wave number. */
	private currentWave: number = 1;

	/** Whether the boss phase is active. */
	private bossPhaseActive: boolean = false;

	/** Remaining invincibility time in seconds after respawn. */
	private invincibilityTimer: number = 0;

	/** Whether the player has a nuke available. */
	private hasNuke: boolean = false;

	/** Reference to the active scene for spawning. */
	private activeScene: Scene | null = null;

	/**
	 * Handles the scene-ready event from the Babylon canvas.
	 * Initializes all game systems and starts the game loop.
	 * @param {Scene} scene
	 * The initialized Babylon.js scene.
	 */
	onSceneReady(scene: Scene): void
	{
		this.activeScene = scene;
		this.gameSceneService.setupEnvironment(scene);
		this.playerShip =
			this.playerShipService.createShip(scene);
		this.inputService.initialize();
		this.audioService.initialize();
		this.particleEffectsService.initialize(scene);

		const shipMesh: TransformNode | null =
			this.playerShipService.getShipMesh();

		if (shipMesh !== null)
		{
			this.collisionHandler.registerPlayer(shipMesh);
		}

		this.startGameLoop(scene);

		this.destroyRef.onDestroy(
			() => this.cleanup(scene));
	}

	/**
	 * Starts the main game loop via the scene's before-render observable.
	 * @param {Scene} scene
	 * The Babylon.js scene to attach the game loop to.
	 * @private
	 */
	private startGameLoop(scene: Scene): void
	{
		this.gameLoopObserver =
			scene.onBeforeRenderObservable.add(
				() =>
				{
					const currentState: GameState =
						this.gameStateService.currentState();

					this.handleStateInput(scene);

					if (currentState !== GameState.Playing)
					{
						return;
					}

					const engine: import("@babylonjs/core/Engines/engine").Engine =
						scene
							.getEngine() as import("@babylonjs/core/Engines/engine").Engine;
					const deltaTime: number =
						engine.getDeltaTime() / 1000;

					this.updateInvincibility(deltaTime);

					this.playerShipService.updateFlight(
						this.inputService.keys,
						deltaTime);

					this.handleFireInput(scene);
					this.handleNukeInput();

					this.weaponService.update(deltaTime);
					this.collisionHandler.syncProjectiles();

					this.enemySwarmService.update(deltaTime);

					if (this.bossPhaseActive)
					{
						this.updateBossPhase(deltaTime);
					}

					this.powerUpService.update(deltaTime);
					this.collisionHandler.syncPowerUps();

					this.processCollisions();
					this.checkWaveCompletion(scene);

					if (this.playerShip !== null)
					{
						this.gameSceneService.updateCameraFollow(
							this.playerShip.position,
							deltaTime);
					}
				});
	}

	/**
	 * Handles input based on the current game state.
	 * Space starts/continues, Escape pauses/resumes.
	 * @param {Scene} scene
	 * The Babylon.js scene for spawning.
	 * @private
	 */
	private handleStateInput(scene: Scene): void
	{
		const currentState: GameState =
			this.gameStateService.currentState();

		if (this.inputService.isKeyPressed(" "))
		{
			if (currentState === GameState.Title)
			{
				this.gameStateService.start();
				this.audioService.startMusic();
				this.enemySwarmService.spawnWave(
					scene,
					this.currentWave);
				this.collisionHandler.registerEnemies();
			}
			else if (currentState === GameState.GameOver)
			{
				this.gameStateService.continueGame();
				this.scoringService.resetForContinue();
				this.resetGameplay(scene);
			}
			else if (currentState === GameState.Victory)
			{
				this.gameStateService.reset();
				this.scoringService.resetForContinue();
				this.collisionHandler.totalKills = 0;
				this.currentWave = 1;
				this.bossPhaseActive = false;
				this.hasNuke = false;
				this.weaponService.setWeapon(WeaponType.MachineGun);
				this.updateHudState();
			}
		}

		if (this.inputService.isKeyPressed("Escape"))
		{
			if (currentState === GameState.Playing)
			{
				this.gameStateService.pause();
				this.audioService.setMusicIntensity("normal");
			}
			else if (currentState === GameState.Paused)
			{
				this.gameStateService.pause();
				this.audioService.setMusicIntensity("normal");
			}
		}
	}

	/**
	 * Resets gameplay state for a continue or new game.
	 * @param {Scene} scene
	 * The Babylon.js scene for spawning.
	 * @private
	 */
	private resetGameplay(scene: Scene): void
	{
		this.currentWave = 1;
		this.bossPhaseActive = false;
		this.hasNuke = false;
		this.invincibilityTimer =
			PLAYER_INVINCIBILITY_DURATION;
		this.weaponService.setWeapon(WeaponType.MachineGun);
		this.weaponService.dispose();
		this.enemySwarmService.dispose();
		this.bossService.dispose();
		this.powerUpService.dispose();
		this.collisionHandler.reset();
		this.enemySwarmService.spawnWave(
			scene,
			this.currentWave);
		this.collisionHandler.registerEnemies();
		this.updateHudState();
	}

	/**
	 * Updates the HUD component with current weapon, nuke, and boss state.
	 * @private
	 */
	private updateHudState(): void
	{
		const hud: GameHudComponent =
			this.hudComponent();

		hud.currentWeapon.set(
			this.weaponService.getCurrentWeapon());
		hud.hasNuke.set(this.hasNuke);
		hud.bossActive.set(this.bossPhaseActive);

		if (this.bossPhaseActive)
		{
			const eyeMeshes: Mesh[] =
				this.bossService.getEyeMeshes();

			hud.bossEyesRemaining.set(eyeMeshes.length);
		}
	}

	/**
	 * Updates invincibility timer after respawn.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 * @private
	 */
	private updateInvincibility(deltaTime: number): void
	{
		if (this.invincibilityTimer > 0)
		{
			this.invincibilityTimer -= deltaTime;
		}
	}

	/**
	 * Handles fire input (Enter key) to create projectiles.
	 * @param {Scene} scene
	 * The Babylon.js scene for projectile creation.
	 * @private
	 */
	private handleFireInput(scene: Scene): void
	{
		if (!this.inputService.isKeyPressed("Enter"))
		{
			return;
		}

		if (this.playerShip === null)
		{
			return;
		}

		const position: Vector3 =
			this.playerShip.position.clone();
		const direction: Vector3 =
			new Vector3(
				0,
				0,
				1);

		const projectiles: Projectile[] | null =
			this.weaponService.fire(
				scene,
				position,
				direction);

		if (projectiles !== null)
		{
			this.audioService.playShot(
				this.weaponService.getCurrentWeapon());

			for (const projectile of projectiles)
			{
				this.collisionHandler.registerProjectile(projectile);
			}
		}
	}

	/**
	 * Handles nuke input (N key) to clear all enemies.
	 * @private
	 */
	private handleNukeInput(): void
	{
		if (!this.inputService.isKeyPressed("n") || !this.hasNuke)
		{
			return;
		}

		this.hasNuke = false;
		this.audioService.playExplosion("nuke");
		this.particleEffectsService.createExplosion(
			this.playerShip?.position ?? { x: 0, y: 0, z: 0 },
			"nuke");

		this.collisionHandler.nukeAllEnemies();
	}

	/**
	 * Updates the boss phase: movement and collision registration.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 * @private
	 */
	private updateBossPhase(deltaTime: number): void
	{
		if (this.playerShip === null)
		{
			return;
		}

		this.bossService.update(
			deltaTime,
			this.playerShip.position);

		if (!this.bossService.isAlive())
		{
			this.scoringService.addScore(BOSS_POINTS);
			this.gameStateService.victory();
			this.bossPhaseActive = false;
			this.scoringService.saveHighScore();
			this.audioService.stopMusic();
			this.audioService.playVictory();
			this.particleEffectsService.createExplosion(
				{ x: 0, y: 5, z: 60 },
				"bossDeath");
			this.updateHudState();
		}
	}

	/**
	 * Processes all collision checks and handles the resulting events.
	 * @private
	 */
	private processCollisions(): void
	{
		const context: CollisionFrameContext =
			{
				bossPhaseActive: this.bossPhaseActive,
				invincibilityTimer: this.invincibilityTimer,
				activeScene: this.activeScene,
				playerPosition: this.playerShip?.position ?? null
			};

		const result: CollisionFrameResult =
			this.collisionHandler.processCollisions(context);

		if (result.hudUpdateNeeded)
		{
			this.updateHudState();
		}

		if (result.playerHit)
		{
			this.invincibilityTimer =
				PLAYER_INVINCIBILITY_DURATION;
		}

		for (const powerUpType of result.collectedPowerUps)
		{
			this.applyPowerUp(powerUpType);
		}
	}

	/**
	 * Applies the effect of a collected power-up.
	 * @param {PowerUpType} type
	 * The type of power-up collected.
	 * @private
	 */
	private applyPowerUp(type: PowerUpType): void
	{
		switch (type)
		{
			case PowerUpType.SpreadGun:
				this.weaponService.setWeapon(WeaponType.SpreadGun);
				break;

			case PowerUpType.Laser:
				this.weaponService.setWeapon(WeaponType.Laser);
				break;

			case PowerUpType.RapidFire:
				this.weaponService.setWeapon(WeaponType.RapidFire);
				break;

			case PowerUpType.Nuke:
				this.hasNuke = true;
				break;
		}

		this.updateHudState();
	}

	/**
	 * Checks if the current wave is complete and handles boss spawn.
	 * @param {Scene} scene
	 * The Babylon.js scene for spawning.
	 * @private
	 */
	private checkWaveCompletion(scene: Scene): void
	{
		if (this.bossPhaseActive)
		{
			return;
		}

		if (!this.enemySwarmService.isWaveComplete())
		{
			return;
		}

		this.bossPhaseActive = true;
		this.bossService.spawnBoss(scene);
		this.collisionHandler.registerBossEyes();
		this.audioService.setMusicIntensity("boss");
		this.updateHudState();
	}

	/**
	 * Cleans up all game resources on component destruction.
	 * @param {Scene} scene
	 * The Babylon.js scene to clean up.
	 * @private
	 */
	private cleanup(scene: Scene): void
	{
		if (this.gameLoopObserver !== null)
		{
			scene.onBeforeRenderObservable.remove(this.gameLoopObserver);
			this.gameLoopObserver = null;
		}

		this.audioService.dispose();
		this.particleEffectsService.dispose();
		this.weaponService.dispose();
		this.powerUpService.dispose();
		this.bossService.dispose();
		this.inputService.dispose();
		this.enemySwarmService.dispose();
		this.playerShipService.dispose();
		this.gameSceneService.dispose();
		this.scoringService.saveHighScore();
	}
}