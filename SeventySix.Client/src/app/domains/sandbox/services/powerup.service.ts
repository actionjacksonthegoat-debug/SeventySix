/**
 * Power-Up Service.
 * Manages power-up spawning, animation, collection, and lifecycle.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { POWERUP_SPAWN_INTERVAL } from "@sandbox/constants/game.constants";
import { type PowerUpInstance, PowerUpType } from "@sandbox/models/game.models";

/**
 * Available power-up types for random selection.
 * @type {PowerUpType[]}
 */
const SPAWNABLE_TYPES: PowerUpType[] =
	[
		PowerUpType.SpreadGun,
		PowerUpType.Laser,
		PowerUpType.RapidFire,
		PowerUpType.Nuke
	];

/**
 * Maximum time in seconds before an uncollected power-up despawns.
 * @type {number}
 */
const POWERUP_TIMEOUT: number = 10;

/**
 * Service responsible for power-up spawning, collection, and lifecycle.
 */
@Injectable()
export class PowerUpService
{
	/**
	 * Currently active power-up instances.
	 * @type {PowerUpInstance[]}
	 * @private
	 */
	private powerUps: PowerUpInstance[] = [];

	/**
	 * Last kill count that triggered a spawn.
	 * @type {number}
	 * @private
	 */
	private lastSpawnKillCount: number = 0;

	/**
	 * Checks if a power-up should spawn based on kill count.
	 * @param {number} totalKills
	 * Total enemies killed so far.
	 * @param {number} lastSpawnedAt
	 * Kill count at last power-up spawn.
	 * @param {Scene} scene
	 * The Babylon.js scene.
	 * @param {Vector3} position
	 * Position to spawn the power-up at.
	 */
	checkSpawn(
		totalKills: number,
		lastSpawnedAt: number,
		scene: Scene,
		position: Vector3): void
	{
		const killsSinceLastSpawn: number =
			totalKills - lastSpawnedAt;

		if (killsSinceLastSpawn >= POWERUP_SPAWN_INTERVAL)
		{
			this.lastSpawnKillCount = totalKills;
			this.spawnPowerUp(
				scene,
				position);
		}
	}

	/**
	 * Spawns a power-up at the given position.
	 * @param {Scene} scene
	 * The Babylon.js scene.
	 * @param {Vector3} position
	 * World position for the power-up.
	 * @param {PowerUpType} [type]
	 * Optional specific type. Random if omitted.
	 */
	spawnPowerUp(
		scene: Scene,
		position: Vector3,
		type?: PowerUpType): void
	{
		const selectedType: PowerUpType =
			type ?? this.selectRandomType();

		const mesh: Mesh =
			this.createPowerUpMesh(
				scene,
				selectedType);

		mesh.position =
			position.clone();

		const instance: PowerUpInstance =
			{
				mesh,
				type: selectedType,
				timeRemaining: POWERUP_TIMEOUT
			};

		this.powerUps.push(instance);
	}

	/**
	 * Updates all active power-ups. Removes expired ones and applies rotation animation.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 */
	update(deltaTime: number): void
	{
		for (let idx: number =
			this.powerUps.length - 1; idx >= 0; idx--)
		{
			const powerUp: PowerUpInstance =
				this.powerUps[idx];

			powerUp.timeRemaining -= deltaTime;
			powerUp.mesh.rotation.y += deltaTime * 2;

			if (powerUp.timeRemaining <= 0)
			{
				powerUp.mesh.dispose();
				this.powerUps.splice(
					idx,
					1);
			}
		}
	}

	/**
	 * Returns all currently active power-ups.
	 * @returns {PowerUpInstance[]}
	 * Array of active power-up instances.
	 */
	getActivePowerUps(): PowerUpInstance[]
	{
		return this.powerUps;
	}

	/**
	 * Returns the kill count at the last power-up spawn.
	 * @returns {number}
	 * The kill count threshold.
	 */
	getLastSpawnKillCount(): number
	{
		return this.lastSpawnKillCount;
	}

	/**
	 * Collects a power-up and removes it from the game world.
	 * @param {PowerUpInstance} powerUp
	 * The power-up to collect.
	 * @returns {PowerUpType}
	 * The type of power-up collected.
	 */
	collectPowerUp(powerUp: PowerUpInstance): PowerUpType
	{
		const collectedType: PowerUpType =
			powerUp.type;
		const index: number =
			this.powerUps.indexOf(powerUp);

		if (index >= 0)
		{
			powerUp.mesh.dispose();
			this.powerUps.splice(
				index,
				1);
		}

		return collectedType;
	}

	/**
	 * Disposes all active power-ups and resets state.
	 */
	dispose(): void
	{
		for (const powerUp of this.powerUps)
		{
			powerUp.mesh.dispose();
		}

		this.powerUps = [];
		this.lastSpawnKillCount = 0;
	}

	/**
	 * Selects a random power-up type from available types.
	 * @returns {PowerUpType}
	 * A randomly selected power-up type.
	 * @private
	 */
	private selectRandomType(): PowerUpType
	{
		const index: number =
			Math.floor(Math.random() * SPAWNABLE_TYPES.length);

		return SPAWNABLE_TYPES[index];
	}

	/**
	 * Creates the visual mesh for a power-up pickup.
	 * @param {Scene} scene
	 * The Babylon.js scene.
	 * @param {PowerUpType} type
	 * The power-up type to create a mesh for.
	 * @returns {Mesh}
	 * The created power-up mesh.
	 * @private
	 */
	private createPowerUpMesh(
		scene: Scene,
		type: PowerUpType): Mesh
	{
		const mesh: Mesh =
			MeshBuilder.CreateSphere(
				`powerup_${type}`,
				{
					diameter: 1.2,
					segments: 8
				},
				scene);

		const material: StandardMaterial =
			new StandardMaterial(
				`powerupMat_${type}`,
				scene);

		material.emissiveColor =
			this.getColorForType(type);
		material.alpha = 0.8;
		material.disableLighting = true;
		mesh.material = material;

		return mesh;
	}

	/**
	 * Returns the emissive color for a given power-up type.
	 * @param {PowerUpType} type
	 * The power-up type.
	 * @returns {Color3}
	 * The color for the power-up.
	 * @private
	 */
	private getColorForType(type: PowerUpType): Color3
	{
		switch (type)
		{
			case PowerUpType.SpreadGun:
				return new Color3(
					1,
					0.5,
					0.2);

			case PowerUpType.Laser:
				return new Color3(
					0.2,
					0.4,
					1);

			case PowerUpType.RapidFire:
				return new Color3(
					0.2,
					1,
					0.3);

			case PowerUpType.Nuke:
				return new Color3(
					1,
					0,
					0);

			default:
				return new Color3(
					1,
					1,
					1);
		}
	}
}