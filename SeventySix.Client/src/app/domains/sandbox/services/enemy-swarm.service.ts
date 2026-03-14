/**
 * Enemy Swarm Service.
 * Manages enemy spawning, formation movement, and destruction.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/polyhedronBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import {
	ENEMY_BASE_POINTS,
	ENEMY_BASE_SPEED,
	ENEMY_SPACING_X,
	ENEMY_SPACING_Y,
	ENEMY_STANDARD_HEALTH,
	ENEMY_WAVE_COLUMNS,
	ENEMY_WAVE_ROWS
} from "@sandbox/constants/game.constants";
import { type EnemyInstance, EnemyType } from "@sandbox/models/game.models";

/**
 * Service for managing enemy waves, formation movement, and enemy lifecycle.
 */
@Injectable()
export class EnemySwarmService
{
	/**
	 * Currently active enemy instances.
	 * @type {EnemyInstance[]}
	 * @private
	 */
	private enemies: EnemyInstance[] = [];

	/**
	 * Current swarm lateral movement direction (1 = right, -1 = left).
	 * @type {number}
	 * @private
	 */
	private swarmDirection: number = 1;

	/**
	 * Timer for swarm descent triggers.
	 * @type {number}
	 * @private
	 */
	private lateralDistance: number = 0;

	/**
	 * Spawns a wave of enemies in a grid formation.
	 * @param {Scene} scene
	 * The Babylon.js scene to add enemies to.
	 * @param {number} waveNumber
	 * The current wave number (affects difficulty).
	 */
	spawnWave(
		scene: Scene,
		waveNumber: number): void
	{
		this.dispose();
		this.swarmDirection = 1;
		this.lateralDistance = 0;

		const enemyMaterial: StandardMaterial =
			this.createEnemyMaterial(scene);

		for (let row: number = 0; row < ENEMY_WAVE_ROWS; row++)
		{
			for (let col: number = 0; col < ENEMY_WAVE_COLUMNS; col++)
			{
				const identifier: string =
					`enemy_${row}_${col}`;

				const mesh: Mesh =
					this.createEnemyMesh(
						identifier,
						scene,
						enemyMaterial);

				const posX: number =
					(col - (ENEMY_WAVE_COLUMNS - 1) / 2) * ENEMY_SPACING_X;
				const posY: number =
					(row - (ENEMY_WAVE_ROWS - 1) / 2) * ENEMY_SPACING_Y;

				mesh.position =
					new Vector3(
						posX,
						posY,
						40 + waveNumber * 5);

				const enemy: EnemyInstance =
					{
						identifier,
						mesh,
						health: ENEMY_STANDARD_HEALTH,
						type: EnemyType.Standard,
						points: ENEMY_BASE_POINTS
					};

				this.enemies.push(enemy);
			}
		}
	}

	/**
	 * Updates swarm movement each frame.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 */
	update(deltaTime: number): void
	{
		const speed: number =
			this.calculateSpeed();
		const movement: number =
			speed * deltaTime * this.swarmDirection;

		this.lateralDistance += Math.abs(movement);

		for (const enemy of this.enemies)
		{
			enemy.mesh.position.x += movement;
		}

		if (this.lateralDistance > 15)
		{
			this.swarmDirection *= -1;
			this.lateralDistance = 0;

			for (const enemy of this.enemies)
			{
				enemy.mesh.position.z -= 0.5;
			}
		}
	}

	/**
	 * Returns all currently active enemies.
	 * @returns {EnemyInstance[]}
	 * Array of active enemy instances.
	 */
	getActiveEnemies(): EnemyInstance[]
	{
		return this.enemies;
	}

	/**
	 * Removes an enemy from the active list and disposes its mesh.
	 * @param {EnemyInstance} enemy
	 * The enemy to remove.
	 */
	removeEnemy(enemy: EnemyInstance): void
	{
		const index: number =
			this.enemies.indexOf(enemy);

		if (index >= 0)
		{
			enemy.mesh.dispose();
			this.enemies.splice(
				index,
				1);
		}
	}

	/**
	 * Returns whether all enemies in the current wave are destroyed.
	 * @returns {boolean}
	 * True if no active enemies remain.
	 */
	isWaveComplete(): boolean
	{
		return this.enemies.length === 0;
	}

	/**
	 * Disposes all enemy meshes and clears the active list.
	 */
	dispose(): void
	{
		for (const enemy of this.enemies)
		{
			enemy.mesh.dispose();
		}

		this.enemies = [];
	}

	/**
	 * Calculates swarm speed based on remaining enemies.
	 * Fewer enemies = faster movement.
	 * @returns {number}
	 * The current swarm speed.
	 * @private
	 */
	private calculateSpeed(): number
	{
		const totalEnemies: number =
			ENEMY_WAVE_ROWS * ENEMY_WAVE_COLUMNS;
		const remainingRatio: number =
			this.enemies.length / totalEnemies;
		const speedMultiplier: number =
			1 + (1 - remainingRatio) * 2;

		return ENEMY_BASE_SPEED * speedMultiplier;
	}

	/**
	 * Creates the shared material for standard enemies.
	 * @param {Scene} scene
	 * The scene to add the material to.
	 * @returns {StandardMaterial}
	 * The enemy material.
	 * @private
	 */
	private createEnemyMaterial(scene: Scene): StandardMaterial
	{
		const material: StandardMaterial =
			new StandardMaterial(
				"enemyMaterial",
				scene);

		material.diffuseColor =
			new Color3(
				0.4,
				0.1,
				0.15);
		material.emissiveColor =
			new Color3(
				0.3,
				0.05,
				0.1);
		material.specularColor =
			new Color3(
				0.5,
				0.2,
				0.2);

		return material;
	}

	/**
	 * Creates a menacing enemy mesh using a polyhedron shape.
	 * @param {string} name
	 * The mesh name identifier.
	 * @param {Scene} scene
	 * The scene to add the mesh to.
	 * @param {StandardMaterial} material
	 * The material to apply to the mesh.
	 * @returns {Mesh}
	 * The created enemy mesh.
	 * @private
	 */
	private createEnemyMesh(
		name: string,
		scene: Scene,
		material: StandardMaterial): Mesh
	{
		const mesh: Mesh =
			MeshBuilder.CreateSphere(
				name,
				{
					diameter: 1.2,
					segments: 6
				},
				scene);

		mesh.material = material;

		mesh.scaling =
			new Vector3(
				1,
				0.7,
				1.3);

		return mesh;
	}
}