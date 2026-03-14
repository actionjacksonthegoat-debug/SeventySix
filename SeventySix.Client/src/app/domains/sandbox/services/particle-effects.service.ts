/**
 * Particle Effects Service.
 * Creates and manages particle-based visual effects for explosions, impacts,
 * engine trails, power-up sparkles, and camera shake.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";

import type { Scene } from "@babylonjs/core/scene";
import { WeaponType } from "@sandbox/models/game.models";

/**
 * Explosion type for particle configuration.
 * @typedef {'standard' | 'elite' | 'bossEye' | 'bossDeath' | 'nuke'} ExplosionType
 */
type ExplosionType = "standard" | "elite" | "bossEye" | "bossDeath" | "nuke";

/**
 * Position-like object with x, y, z coordinates.
 * @interface PositionLike
 */
interface PositionLike
{
	/** X coordinate. */
	readonly x: number;
	/** Y coordinate. */
	readonly y: number;
	/** Z coordinate. */
	readonly z: number;
}

/**
 * Service for creating and managing visual particle effects.
 * Handles explosions, weapon impacts, engine trails, and camera shake.
 */
@Injectable()
export class ParticleEffectsService
{
	/**
	 * Active particle systems being tracked for cleanup.
	 * @type {ParticleSystem[]}
	 * @private
	 */
	private activeSystems: ParticleSystem[] = [];

	/**
	 * Reference to the Babylon.js scene.
	 * @type {Scene | null}
	 * @private
	 */
	private scene: Scene | null = null;

	/**
	 * Active camera shake animation frame ID.
	 * @type {number | null}
	 * @private
	 */
	private shakeAnimationId: number | null = null;

	/**
	 * Initializes the service with the active Babylon.js scene.
	 * @param {Scene} scene
	 * The Babylon.js scene to attach particles to.
	 */
	initialize(scene: Scene): void
	{
		this.scene = scene;
	}

	/**
	 * Creates an explosion effect at the specified position.
	 * @param {PositionLike} position
	 * World position for the explosion center.
	 * @param {ExplosionType} type
	 * Type of explosion to create.
	 */
	createExplosion(
		position: PositionLike,
		type: ExplosionType): void
	{
		if (this.scene === null)
		{
			return;
		}

		const explosionPosition: Vector3 =
			new Vector3(
				position.x,
				position.y,
				position.z);

		switch (type)
		{
			case "standard":
				this.createStandardExplosion(explosionPosition);
				break;
			case "elite":
				this.createEliteExplosion(explosionPosition);
				break;
			case "bossEye":
				this.createBossEyeExplosion(explosionPosition);
				break;
			case "bossDeath":
				this.createBossDeathExplosion(explosionPosition);
				break;
			case "nuke":
				this.createNukeExplosion(explosionPosition);
				break;
		}
	}

	/**
	 * Creates a weapon impact particle burst at the given position.
	 * @param {PositionLike} position
	 * World position for the impact.
	 * @param {WeaponType} weaponType
	 * Weapon type determining impact visual style.
	 */
	createImpact(
		position: PositionLike,
		weaponType: WeaponType): void
	{
		if (this.scene === null)
		{
			return;
		}

		const impactPosition: Vector3 =
			new Vector3(
				position.x,
				position.y,
				position.z);
		const particleCount: number = 50;
		const system: ParticleSystem =
			this.createBaseSystem(
				"impact",
				particleCount,
				impactPosition);

		system.minLifeTime = 0.1;
		system.maxLifeTime = 0.3;
		system.minSize = 0.05;
		system.maxSize = 0.15;
		system.emitRate = 0;
		system.manualEmitCount = particleCount;
		system.minEmitPower = 3;
		system.maxEmitPower = 6;
		system.targetStopDuration = 0.3;
		system.disposeOnStop = true;

		this.applyImpactColors(
			system,
			weaponType);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Creates engine trail particle emitters attached to a mesh.
	 * @param {Mesh} emitterMesh
	 * The mesh to attach engine trails to.
	 * @returns {ParticleSystem}
	 * The created trail particle system.
	 */
	createEngineTrail(emitterMesh: Mesh): ParticleSystem
	{
		const system: ParticleSystem =
			this.createBaseSystem(
				"engineTrail",
				100,
				Vector3.Zero());

		system.emitter = emitterMesh;
		system.minLifeTime = 0.1;
		system.maxLifeTime = 0.4;
		system.minSize = 0.05;
		system.maxSize = 0.15;
		system.emitRate = 60;
		system.minEmitPower = 0.5;
		system.maxEmitPower = 1.5;

		system.color1 =
			new Color4(0.8, 0.9, 1, 1);
		system.color2 =
			new Color4(1, 0.6, 0.2, 1);
		system.colorDead =
			new Color4(1, 0.2, 0, 0);

		system.direction1 =
			new Vector3(-0.1, -0.1, -1);
		system.direction2 =
			new Vector3(0.1, 0.1, -0.5);

		system.start();
		this.trackSystem(system);

		return system;
	}

	/**
	 * Creates gentle sparkle particles around a power-up mesh.
	 * @param {Mesh} mesh
	 * The power-up mesh to sparkle around.
	 * @returns {ParticleSystem}
	 * The created sparkle particle system.
	 */
	createPowerUpSparkle(mesh: Mesh): ParticleSystem
	{
		const system: ParticleSystem =
			this.createBaseSystem(
				"sparkle",
				30,
				Vector3.Zero());

		system.emitter = mesh;
		system.minLifeTime = 0.3;
		system.maxLifeTime = 0.8;
		system.minSize = 0.05;
		system.maxSize = 0.12;
		system.emitRate = 15;
		system.minEmitPower = 0.2;
		system.maxEmitPower = 0.6;

		system.color1 =
			new Color4(1, 1, 0.5, 1);
		system.color2 =
			new Color4(0.5, 1, 1, 1);
		system.colorDead =
			new Color4(1, 1, 1, 0);

		system.direction1 =
			new Vector3(-0.5, -0.5, -0.5);
		system.direction2 =
			new Vector3(0.5, 0.5, 0.5);

		system.start();
		this.trackSystem(system);

		return system;
	}

	/**
	 * Creates an inward particle implosion effect toward the player.
	 * @param {PositionLike} position
	 * The collection position.
	 */
	createCollectionImplosion(position: PositionLike): void
	{
		if (this.scene === null)
		{
			return;
		}

		const implosionPosition: Vector3 =
			new Vector3(
				position.x,
				position.y,
				position.z);
		const system: ParticleSystem =
			this.createBaseSystem(
				"implosion",
				80,
				implosionPosition);

		system.minLifeTime = 0.2;
		system.maxLifeTime = 0.5;
		system.minSize = 0.08;
		system.maxSize = 0.2;
		system.emitRate = 0;
		system.manualEmitCount = 80;
		system.minEmitPower = -3;
		system.maxEmitPower = -1;
		system.targetStopDuration = 0.5;
		system.disposeOnStop = true;

		system.color1 =
			new Color4(1, 1, 0.3, 1);
		system.color2 =
			new Color4(0.3, 1, 0.3, 1);
		system.colorDead =
			new Color4(1, 1, 1, 0);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Shakes the camera for dramatic effect.
	 * @param {Camera} camera
	 * The camera to shake.
	 * @param {number} intensity
	 * Shake magnitude in world units.
	 * @param {number} duration
	 * Duration in milliseconds.
	 */
	shakeCamera(
		camera: Camera,
		intensity: number,
		duration: number): void
	{
		if (this.shakeAnimationId !== null)
		{
			cancelAnimationFrame(this.shakeAnimationId);
		}

		const originalPosition: Vector3 =
			camera.position.clone();
		const startTime: number =
			performance.now();

		const animate: () => void =
			() =>
			{
				const elapsed: number =
					performance.now() - startTime;
				const progress: number =
					Math.min(elapsed / duration, 1);
				const decay: number =
					1 - progress;
				const shakeX: number =
					(Math.random() - 0.5) * 2 * intensity * decay;
				const shakeY: number =
					(Math.random() - 0.5) * 2 * intensity * decay;

				camera.position.x =
					originalPosition.x + shakeX;
				camera.position.y =
					originalPosition.y + shakeY;

				if (progress < 1)
				{
					this.shakeAnimationId =
						requestAnimationFrame(animate);
				}
				else
				{
					camera.position.copyFrom(originalPosition);
					this.shakeAnimationId = null;
				}
			};

		this.shakeAnimationId =
			requestAnimationFrame(animate);
	}

	/**
	 * Returns the number of currently active particle systems.
	 * @returns {number}
	 * Count of active systems.
	 */
	getActiveCount(): number
	{
		return this.activeSystems.length;
	}

	/**
	 * Disposes all active particle systems and cleans up resources.
	 */
	dispose(): void
	{
		if (this.shakeAnimationId !== null)
		{
			cancelAnimationFrame(this.shakeAnimationId);
			this.shakeAnimationId = null;
		}

		for (const system of this.activeSystems)
		{
			system.stop();
			system.dispose();
		}

		this.activeSystems = [];
		this.scene = null;
	}

	/**
	 * Creates a standard enemy explosion (orange-red, 200 particles).
	 * @param {Vector3} position
	 * Explosion center in world space.
	 * @private
	 */
	private createStandardExplosion(position: Vector3): void
	{
		const particleCount: number = 200;
		const system: ParticleSystem =
			this.createBaseSystem(
				"standardExplosion",
				particleCount,
				position);

		system.minLifeTime = 0.3;
		system.maxLifeTime = 0.8;
		system.minSize = 0.1;
		system.maxSize = 0.4;
		system.emitRate = 0;
		system.manualEmitCount = particleCount;
		system.minEmitPower = 4;
		system.maxEmitPower = 8;
		system.targetStopDuration = 0.8;
		system.disposeOnStop = true;

		system.color1 =
			new Color4(1, 1, 1, 1);
		system.color2 =
			new Color4(1, 0.6, 0, 1);
		system.colorDead =
			new Color4(0.3, 0, 0, 0);

		system.direction1 =
			new Vector3(-1, -1, -1);
		system.direction2 =
			new Vector3(1, 1, 1);
		system.gravity =
			new Vector3(0, -2, 0);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Creates an elite enemy explosion (blue-purple, 400 particles).
	 * @param {Vector3} position
	 * Explosion center in world space.
	 * @private
	 */
	private createEliteExplosion(position: Vector3): void
	{
		const particleCount: number = 400;
		const system: ParticleSystem =
			this.createBaseSystem(
				"eliteExplosion",
				particleCount,
				position);

		system.minLifeTime = 0.5;
		system.maxLifeTime = 1.2;
		system.minSize = 0.15;
		system.maxSize = 0.5;
		system.emitRate = 0;
		system.manualEmitCount = particleCount;
		system.minEmitPower = 5;
		system.maxEmitPower = 10;
		system.targetStopDuration = 1.2;
		system.disposeOnStop = true;

		system.color1 =
			new Color4(1, 1, 1, 1);
		system.color2 =
			new Color4(0.3, 0.3, 1, 1);
		system.colorDead =
			new Color4(0.4, 0, 0.6, 0);

		system.direction1 =
			new Vector3(-1.5, -1.5, -1.5);
		system.direction2 =
			new Vector3(1.5, 1.5, 1.5);
		system.gravity =
			new Vector3(0, -1.5, 0);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Creates a boss eye explosion (green-yellow goo, 300 particles).
	 * @param {Vector3} position
	 * Explosion center in world space.
	 * @private
	 */
	private createBossEyeExplosion(position: Vector3): void
	{
		const particleCount: number = 300;
		const system: ParticleSystem =
			this.createBaseSystem(
				"bossEyeExplosion",
				particleCount,
				position);

		system.minLifeTime = 0.4;
		system.maxLifeTime = 1.0;
		system.minSize = 0.1;
		system.maxSize = 0.35;
		system.emitRate = 0;
		system.manualEmitCount = particleCount;
		system.minEmitPower = 3;
		system.maxEmitPower = 7;
		system.targetStopDuration = 1.0;
		system.disposeOnStop = true;

		system.color1 =
			new Color4(0.2, 1, 0.2, 1);
		system.color2 =
			new Color4(1, 1, 0, 1);
		system.colorDead =
			new Color4(0, 0.3, 0, 0);

		system.direction1 =
			new Vector3(-1, -2, -1);
		system.direction2 =
			new Vector3(1, 0.5, 1);
		system.gravity =
			new Vector3(0, -6, 0);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Creates a multi-stage boss death explosion (1000+ particles across 3 stages).
	 * @param {Vector3} position
	 * Boss center in world space.
	 * @private
	 */
	private createBossDeathExplosion(position: Vector3): void
	{
		this.createBossDeathStage(
			position,
			0);

		setTimeout(
			() =>
				this.createBossDeathStage(
					position,
					1),
			500);

		setTimeout(
			() =>
				this.createBossDeathStage(
					position,
					2),
			1000);
	}

	/**
	 * Creates a single stage of the boss death explosion sequence.
	 * @param {Vector3} position
	 * Boss center in world space.
	 * @param {number} stage
	 * Stage index (0, 1, or 2).
	 * @private
	 */
	private createBossDeathStage(
		position: Vector3,
		stage: number): void
	{
		if (this.scene === null)
		{
			return;
		}

		const particleCount: number =
			stage === 2 ? 1500 : 800;
		const system: ParticleSystem =
			this.createBaseSystem(
				`bossDeathStage${stage}`,
				particleCount,
				position);

		system.minLifeTime = 0.5;
		system.maxLifeTime = 2.0;
		system.minSize = 0.2;
		system.maxSize =
			stage === 2 ? 1.0 : 0.6;
		system.emitRate = 0;
		system.manualEmitCount = particleCount;
		system.minEmitPower =
			6 + stage * 3;
		system.maxEmitPower =
			12 + stage * 4;
		system.targetStopDuration = 2.0;
		system.disposeOnStop = true;

		system.color1 =
			new Color4(1, 1, 1, 1);
		system.color2 =
			new Color4(1, 0.8, 0.2, 1);
		system.colorDead =
			new Color4(0.5, 0, 0, 0);

		const spread: number =
			2 + stage;

		system.direction1 =
			new Vector3(-spread, -spread, -spread);
		system.direction2 =
			new Vector3(spread, spread, spread);
		system.gravity =
			new Vector3(0, -1, 0);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Creates a nuke screen-clear explosion effect.
	 * @param {Vector3} position
	 * Central position for the nuke effect.
	 * @private
	 */
	private createNukeExplosion(position: Vector3): void
	{
		const particleCount: number = 2000;
		const system: ParticleSystem =
			this.createBaseSystem(
				"nukeExplosion",
				particleCount,
				position);

		system.minLifeTime = 0.8;
		system.maxLifeTime = 2.5;
		system.minSize = 0.3;
		system.maxSize = 1.5;
		system.emitRate = 0;
		system.manualEmitCount = particleCount;
		system.minEmitPower = 10;
		system.maxEmitPower = 25;
		system.targetStopDuration = 2.5;
		system.disposeOnStop = true;

		system.color1 =
			new Color4(1, 1, 1, 1);
		system.color2 =
			new Color4(1, 1, 0.5, 1);
		system.colorDead =
			new Color4(1, 0.3, 0, 0);

		const spread: number = 5;

		system.direction1 =
			new Vector3(-spread, -spread, -spread);
		system.direction2 =
			new Vector3(spread, spread, spread);

		system.start();
		this.trackSystem(system);
	}

	/**
	 * Applies weapon-specific colors to an impact particle system.
	 * @param {ParticleSystem} system
	 * The particle system to color.
	 * @param {WeaponType} weaponType
	 * The weapon type determining color scheme.
	 * @private
	 */
	private applyImpactColors(
		system: ParticleSystem,
		weaponType: WeaponType): void
	{
		switch (weaponType)
		{
			case WeaponType.MachineGun:
				system.color1 =
					new Color4(0.7, 0.8, 1, 1);
				system.color2 =
					new Color4(1, 1, 1, 1);
				system.colorDead =
					new Color4(0.3, 0.4, 0.8, 0);
				break;
			case WeaponType.SpreadGun:
				system.color1 =
					new Color4(1, 0.7, 0.2, 1);
				system.color2 =
					new Color4(1, 0.5, 0, 1);
				system.colorDead =
					new Color4(0.5, 0.2, 0, 0);
				break;
			case WeaponType.Laser:
				system.color1 =
					new Color4(0.3, 0.5, 1, 1);
				system.color2 =
					new Color4(0.5, 0.8, 1, 1);
				system.colorDead =
					new Color4(0, 0.2, 0.8, 0);
				break;
			case WeaponType.RapidFire:
				system.color1 =
					new Color4(1, 1, 0.5, 1);
				system.color2 =
					new Color4(0.8, 1, 0.3, 1);
				system.colorDead =
					new Color4(0.5, 0.5, 0, 0);
				break;
		}
	}

	/**
	 * Creates a base particle system with common configuration.
	 * @param {string} name
	 * System identifier name.
	 * @param {number} capacity
	 * Maximum particle count.
	 * @param {Vector3} emitterPosition
	 * Emitter position in world space.
	 * @returns {ParticleSystem}
	 * Configured but not yet started particle system.
	 * @private
	 */
	private createBaseSystem(
		name: string,
		capacity: number,
		emitterPosition: Vector3): ParticleSystem
	{
		const system: ParticleSystem =
			new ParticleSystem(
				name,
				capacity,
				this.scene!);

		system.emitter = emitterPosition;
		system.createPointEmitter(
			new Vector3(-1, -1, -1),
			new Vector3(1, 1, 1));

		return system;
	}

	/**
	 * Tracks a particle system for disposal management.
	 * Automatically removes self-disposing systems from tracking.
	 * @param {ParticleSystem} system
	 * The particle system to track.
	 * @private
	 */
	private trackSystem(system: ParticleSystem): void
	{
		this.activeSystems.push(system);

		if (system.disposeOnStop)
		{
			system.onDisposeObservable.add(
				() =>
				{
					const index: number =
						this.activeSystems.indexOf(system);

					if (index >= 0)
					{
						this.activeSystems.splice(
							index,
							1);
					}
				});
		}
	}
}