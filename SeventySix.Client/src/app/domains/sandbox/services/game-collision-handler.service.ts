/**
 * Game Collision Handler Service.
 * Owns collidable entity maps and processes all collision detection and response
 * for the Galactic Assault game.
 * Domain-scoped service — must be provided via route providers array.
 */

import { inject, Injectable } from "@angular/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import {
	BOSS_EYE_COLLISION_RADIUS,
	ENEMY_COLLISION_RADIUS,
	PLAYER_COLLISION_RADIUS,
	POWERUP_COLLISION_RADIUS,
	PROJECTILE_COLLISION_RADIUS
} from "@sandbox/constants/game.constants";
import {
	type CollidableEntity,
	type CollisionFrameContext,
	type CollisionFrameResult,
	type CollisionResult,
	type EnemyInstance,
	type PowerUpInstance,
	PowerUpType,
	type Projectile
} from "@sandbox/models/game.models";
import { BossService } from "@sandbox/services/boss.service";
import { CollisionService } from "@sandbox/services/collision.service";
import { EnemySwarmService } from "@sandbox/services/enemy-swarm.service";
import { GameAudioService } from "@sandbox/services/game-audio.service";
import { GameStateService } from "@sandbox/services/game-state.service";
import { ParticleEffectsService } from "@sandbox/services/particle-effects.service";
import { PowerUpService } from "@sandbox/services/powerup.service";
import { ScoringService } from "@sandbox/services/scoring.service";
import { WeaponService } from "@sandbox/services/weapon.service";

/**
 * Manages all collision registration, synchronization, and response processing.
 */
@Injectable()
export class GameCollisionHandlerService
{
	/** Bounding sphere collision detection service. */
	private readonly collisionService: CollisionService =
		inject(CollisionService);

	/** Weapon firing and projectile management service. */
	private readonly weaponService: WeaponService =
		inject(WeaponService);

	/** Enemy wave spawning and movement service. */
	private readonly enemySwarmService: EnemySwarmService =
		inject(EnemySwarmService);

	/** Beholder boss creation and behavior service. */
	private readonly bossService: BossService =
		inject(BossService);

	/** Procedural audio synthesis service. */
	private readonly audioService: GameAudioService =
		inject(GameAudioService);

	/** Particle effects service for explosions and impacts. */
	private readonly particleEffectsService: ParticleEffectsService =
		inject(ParticleEffectsService);

	/** Power-up spawning and collection service. */
	private readonly powerUpService: PowerUpService =
		inject(PowerUpService);

	/** Score, lives, and high score management service. */
	private readonly scoringService: ScoringService =
		inject(ScoringService);

	/** Game state machine service. */
	private readonly gameStateService: GameStateService =
		inject(GameStateService);

	/** Player collision entity for unregistration. */
	private playerCollidable: CollidableEntity | null = null;

	/** Map of enemy identifiers to collision entities. */
	private readonly enemyCollidables: Map<string, CollidableEntity> =
		new Map<string, CollidableEntity>();

	/** Map of projectile meshes to collision entities. */
	private readonly projectileCollidables: Map<Mesh, CollidableEntity> =
		new Map<Mesh, CollidableEntity>();

	/** Map of boss eye meshes to their eye indices. */
	private readonly bossEyeCollidables: Map<Mesh, number> =
		new Map<Mesh, number>();

	/** Map of power-up meshes to collision entities. */
	private readonly powerUpCollidables: Map<Mesh, CollidableEntity> =
		new Map<Mesh, CollidableEntity>();

	/** Total number of enemies killed across all waves. */
	totalKills: number = 0;

	/**
	 * Registers the player ship as a collidable entity.
	 * @param {TransformNode} shipMesh
	 * The player ship transform node.
	 */
	registerPlayer(shipMesh: TransformNode): void
	{
		const childMeshes: import("@babylonjs/core/Meshes/abstractMesh").AbstractMesh[] =
			shipMesh.getChildMeshes();

		if (childMeshes.length === 0)
		{
			return;
		}

		this.playerCollidable =
			{
				mesh: childMeshes[0] as Mesh,
				radius: PLAYER_COLLISION_RADIUS,
				group: "player"
			};

		this.collisionService.register(this.playerCollidable);
	}

	/**
	 * Registers all active enemies as collidable entities.
	 */
	registerEnemies(): void
	{
		const enemies: EnemyInstance[] =
			this.enemySwarmService.getActiveEnemies();

		for (const enemy of enemies)
		{
			const collidable: CollidableEntity =
				{
					mesh: enemy.mesh,
					radius: ENEMY_COLLISION_RADIUS,
					group: "enemy"
				};

			this.enemyCollidables.set(
				enemy.identifier,
				collidable);
			this.collisionService.register(collidable);
		}
	}

	/**
	 * Registers boss eye meshes as collidable entities.
	 */
	registerBossEyes(): void
	{
		const eyeMeshes: Mesh[] =
			this.bossService.getEyeMeshes();

		for (let idx: number = 0; idx < eyeMeshes.length; idx++)
		{
			const collidable: CollidableEntity =
				{
					mesh: eyeMeshes[idx],
					radius: BOSS_EYE_COLLISION_RADIUS,
					group: "bossEye"
				};

			this.bossEyeCollidables.set(
				eyeMeshes[idx],
				idx);
			this.collisionService.register(collidable);
		}
	}

	/**
	 * Registers a projectile as a collidable entity.
	 * @param {Projectile} projectile
	 * The projectile to register.
	 */
	registerProjectile(projectile: Projectile): void
	{
		const collidable: CollidableEntity =
			{
				mesh: projectile.mesh,
				radius: PROJECTILE_COLLISION_RADIUS,
				group: "projectile"
			};

		this.projectileCollidables.set(
			projectile.mesh,
			collidable);
		this.collisionService.register(collidable);
	}

	/**
	 * Synchronizes projectile collision registrations with active projectiles.
	 */
	syncProjectiles(): void
	{
		const activeProjectiles: Projectile[] =
			this.weaponService.getActiveProjectiles();
		const activeMeshes: Set<Mesh> =
			new Set<Mesh>(
				activeProjectiles.map(
					(prj: Projectile) => prj.mesh));

		for (const [mesh, collidable] of this.projectileCollidables)
		{
			if (!activeMeshes.has(mesh))
			{
				this.collisionService.unregister(collidable);
				this.projectileCollidables.delete(mesh);
			}
		}
	}

	/**
	 * Synchronizes power-up collision registrations with active power-ups.
	 */
	syncPowerUps(): void
	{
		const activePowerUps: PowerUpInstance[] =
			this.powerUpService.getActivePowerUps();
		const activeMeshes: Set<Mesh> =
			new Set<Mesh>(
				activePowerUps.map(
					(pup: PowerUpInstance) => pup.mesh));

		for (const [mesh, collidable] of this.powerUpCollidables)
		{
			if (!activeMeshes.has(mesh))
			{
				this.collisionService.unregister(collidable);
				this.powerUpCollidables.delete(mesh);
			}
		}

		for (const powerUp of activePowerUps)
		{
			if (!this.powerUpCollidables.has(powerUp.mesh))
			{
				this.registerPowerUp(powerUp);
			}
		}
	}

	/**
	 * Processes all collision checks for a single frame.
	 * @param {CollisionFrameContext} context
	 * The current frame state context.
	 * @returns {CollisionFrameResult}
	 * The collision events that occurred this frame.
	 */
	processCollisions(context: CollisionFrameContext): CollisionFrameResult
	{
		const result: CollisionFrameResult =
			{
				hudUpdateNeeded: false,
				playerHit: false,
				isGameOver: false,
				collectedPowerUps: []
			};

		this.checkProjectileEnemyCollisions(
			context);
		this.checkProjectileBossCollisions(
			context,
			result);
		this.checkPlayerEnemyCollisions(
			context,
			result);
		this.checkPlayerPowerUpCollisions(result);

		return result;
	}

	/**
	 * Clears all enemies via nuke, awarding score and creating explosions.
	 */
	nukeAllEnemies(): void
	{
		const enemies: EnemyInstance[] =
			[...this.enemySwarmService.getActiveEnemies()];

		for (const enemy of enemies)
		{
			this.scoringService.addScore(enemy.points);
			this.totalKills++;

			this.particleEffectsService.createExplosion(
				enemy.mesh.position,
				"standard");

			const collidable: CollidableEntity | undefined =
				this.enemyCollidables.get(enemy.identifier);

			if (collidable !== undefined)
			{
				this.collisionService.unregister(collidable);
				this.enemyCollidables.delete(enemy.identifier);
			}

			this.enemySwarmService.removeEnemy(enemy);
		}
	}

	/**
	 * Resets all collision state for a new game or continue.
	 */
	reset(): void
	{
		this.totalKills = 0;
		this.enemyCollidables.clear();
		this.projectileCollidables.clear();
		this.bossEyeCollidables.clear();
		this.powerUpCollidables.clear();
	}

	/**
	 * Registers a power-up as a collidable entity.
	 * @param {PowerUpInstance} powerUp
	 * The power-up to register.
	 * @private
	 */
	private registerPowerUp(powerUp: PowerUpInstance): void
	{
		const collidable: CollidableEntity =
			{
				mesh: powerUp.mesh,
				radius: POWERUP_COLLISION_RADIUS,
				group: "powerup"
			};

		this.powerUpCollidables.set(
			powerUp.mesh,
			collidable);
		this.collisionService.register(collidable);
	}

	/**
	 * Checks collisions between player projectiles and enemies.
	 * @param {CollisionFrameContext} context
	 * The current frame context.
	 * @private
	 */
	private checkProjectileEnemyCollisions(
		context: CollisionFrameContext): void
	{
		const collisions: CollisionResult[] =
			this.collisionService.checkCollisions(
				"projectile",
				"enemy");

		for (const collision of collisions)
		{
			const projectileEntity: CollidableEntity =
				collision.entityA.group === "projectile"
					? collision.entityA
					: collision.entityB;

			const enemyEntity: CollidableEntity =
				collision.entityA.group === "enemy"
					? collision.entityA
					: collision.entityB;

			const projectile: Projectile | undefined =
				this.findProjectileByMesh(projectileEntity.mesh);

			const enemy: EnemyInstance | undefined =
				this
					.enemySwarmService
					.getActiveEnemies()
					.find(
						(ene: EnemyInstance) =>
							ene.mesh === enemyEntity.mesh);

			if (enemy !== undefined)
			{
				this.handleEnemyDestruction(
					enemy,
					context);
			}

			if (projectile !== undefined && !projectile.piercing)
			{
				this.removeProjectileCollidable(projectile);
			}
		}
	}

	/**
	 * Handles scoring, effects, and cleanup when an enemy is destroyed.
	 * @param {EnemyInstance} enemy
	 * The destroyed enemy instance.
	 * @param {CollisionFrameContext} context
	 * The current frame context for power-up spawning.
	 * @private
	 */
	private handleEnemyDestruction(
		enemy: EnemyInstance,
		context: CollisionFrameContext): void
	{
		this.scoringService.addScore(enemy.points);
		this.totalKills++;
		this.audioService.playExplosion("small");
		this.particleEffectsService.createExplosion(
			enemy.mesh.position,
			enemy.type === "Elite" ? "elite" : "standard");

		const enemyCollidable: CollidableEntity | undefined =
			this.enemyCollidables.get(enemy.identifier);

		if (enemyCollidable !== undefined)
		{
			this.collisionService.unregister(enemyCollidable);
			this.enemyCollidables.delete(enemy.identifier);
		}

		this.enemySwarmService.removeEnemy(enemy);

		if (context.activeScene !== null && context.playerPosition !== null)
		{
			this.powerUpService.checkSpawn(
				this.totalKills,
				this.powerUpService.getLastSpawnKillCount(),
				context.activeScene,
				enemy.mesh.position.clone());
		}
	}

	/**
	 * Checks collisions between player projectiles and boss eyes.
	 * @param {CollisionFrameContext} context
	 * The current frame context.
	 * @param {CollisionFrameResult} result
	 * The result accumulator.
	 * @private
	 */
	private checkProjectileBossCollisions(
		context: CollisionFrameContext,
		result: CollisionFrameResult): void
	{
		if (!context.bossPhaseActive)
		{
			return;
		}

		const collisions: CollisionResult[] =
			this.collisionService.checkCollisions(
				"projectile",
				"bossEye");

		for (const collision of collisions)
		{
			const projectileEntity: CollidableEntity =
				collision.entityA.group === "projectile"
					? collision.entityA
					: collision.entityB;

			const eyeEntity: CollidableEntity =
				collision.entityA.group === "bossEye"
					? collision.entityA
					: collision.entityB;

			const eyeIndex: number | undefined =
				this.bossEyeCollidables.get(eyeEntity.mesh as Mesh);

			if (eyeIndex !== undefined)
			{
				this.bossService.damageEye(eyeIndex);
				this.audioService.playExplosion("small");
				this.particleEffectsService.createExplosion(
					eyeEntity.mesh.position,
					"bossEye");
				this.collisionService.unregister(eyeEntity);
				this.bossEyeCollidables.delete(eyeEntity.mesh as Mesh);
				result.hudUpdateNeeded = true;
			}

			const projectile: Projectile | undefined =
				this.findProjectileByMesh(projectileEntity.mesh);

			if (projectile !== undefined && !projectile.piercing)
			{
				this.removeProjectileCollidable(projectile);
			}
		}
	}

	/**
	 * Checks collisions between the player and enemies.
	 * @param {CollisionFrameContext} context
	 * The current frame context.
	 * @param {CollisionFrameResult} result
	 * The result accumulator.
	 * @private
	 */
	private checkPlayerEnemyCollisions(
		context: CollisionFrameContext,
		result: CollisionFrameResult): void
	{
		if (context.invincibilityTimer > 0)
		{
			return;
		}

		const collisions: CollisionResult[] =
			this.collisionService.checkCollisions(
				"player",
				"enemy");

		if (collisions.length > 0)
		{
			this.audioService.playPlayerHit();

			const isGameOver: boolean =
				this.scoringService.loseLife();

			if (isGameOver)
			{
				this.gameStateService.gameOver();
				this.scoringService.saveHighScore();
				this.audioService.stopMusic();
				this.audioService.playGameOver();
				result.isGameOver = true;
			}
			else
			{
				result.playerHit = true;
			}
		}
	}

	/**
	 * Checks collisions between the player and power-ups.
	 * @param {CollisionFrameResult} result
	 * The result accumulator.
	 * @private
	 */
	private checkPlayerPowerUpCollisions(
		result: CollisionFrameResult): void
	{
		const collisions: CollisionResult[] =
			this.collisionService.checkCollisions(
				"player",
				"powerup");

		for (const collision of collisions)
		{
			const powerUpEntity: CollidableEntity =
				collision.entityA.group === "powerup"
					? collision.entityA
					: collision.entityB;

			const powerUp: PowerUpInstance | undefined =
				this
					.powerUpService
					.getActivePowerUps()
					.find(
						(pup: PowerUpInstance) =>
							pup.mesh === powerUpEntity.mesh);

			if (powerUp !== undefined)
			{
				const collidable: CollidableEntity | undefined =
					this.powerUpCollidables.get(powerUp.mesh);

				if (collidable !== undefined)
				{
					this.collisionService.unregister(collidable);
					this.powerUpCollidables.delete(powerUp.mesh);
				}

				const collectedType: PowerUpType =
					this.powerUpService.collectPowerUp(powerUp);

				this.audioService.playPowerUp();
				this.particleEffectsService.createCollectionImplosion(
					powerUp.mesh.position);

				result.collectedPowerUps.push(collectedType);
			}
		}
	}

	/**
	 * Finds a projectile instance by its mesh reference.
	 * @param {Mesh} mesh
	 * The mesh to search for.
	 * @returns {Projectile | undefined}
	 * The matching projectile or undefined.
	 * @private
	 */
	private findProjectileByMesh(mesh: Mesh): Projectile | undefined
	{
		return this
			.weaponService
			.getActiveProjectiles()
			.find(
				(prj: Projectile) => prj.mesh === mesh);
	}

	/**
	 * Unregisters and removes a non-piercing projectile from collision tracking.
	 * @param {Projectile} projectile
	 * The projectile to remove.
	 * @private
	 */
	private removeProjectileCollidable(projectile: Projectile): void
	{
		const projectileCollidable: CollidableEntity | undefined =
			this.projectileCollidables.get(
				projectile.mesh);

		if (projectileCollidable !== undefined)
		{
			this.collisionService.unregister(projectileCollidable);
			this.projectileCollidables.delete(projectile.mesh);
		}

		this.weaponService.removeProjectile(projectile);
	}
}