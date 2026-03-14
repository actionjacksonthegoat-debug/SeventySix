/**
 * Boss Service.
 * Creates and manages the Beholder boss: mesh, tentacles, eye hitboxes, and behavior.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import {
	BOSS_EYE_COUNT,
	BOSS_HEALTH,
	BOSS_SPEED
} from "@sandbox/constants/game.constants";

/**
 * Represents a single eye tentacle on the boss.
 */
interface BossEye
{
	/** The eye mesh at the tentacle tip. */
	mesh: Mesh;

	/** The tentacle segments. */
	segments: Mesh[];

	/** Whether this eye has been destroyed. */
	destroyed: boolean;

	/** Animation phase offset for writhing. */
	phaseOffset: number;
}

/**
 * Service responsible for Beholder boss creation, behavior, and destruction.
 */
@Injectable()
export class BossService
{
	/**
	 * Root transform node for the boss hierarchy.
	 * @type {TransformNode | null}
	 * @private
	 */
	private bossRoot: TransformNode | null = null;

	/**
	 * Body mesh of the boss.
	 * @type {Mesh | null}
	 * @private
	 */
	private bodyMesh: Mesh | null = null;

	/**
	 * Central cosmetic eye mesh.
	 * @type {Mesh | null}
	 * @private
	 */
	private centralEye: Mesh | null = null;

	/**
	 * Array of eye tentacles.
	 * @type {BossEye[]}
	 * @private
	 */
	private eyes: BossEye[] = [];

	/**
	 * Whether the boss is currently alive.
	 * @type {boolean}
	 * @private
	 */
	private alive: boolean = false;

	/**
	 * Animation time accumulator for writhing.
	 * @type {number}
	 * @private
	 */
	private animationTime: number = 0;

	/**
	 * The Babylon.js scene reference.
	 * @type {Scene | null}
	 * @private
	 */
	private scene: Scene | null = null;

	/**
	 * Spawns the Beholder boss at a distant position.
	 * @param {Scene} bossScene
	 * The Babylon.js scene to add the boss to.
	 */
	spawnBoss(bossScene: Scene): void
	{
		this.scene = bossScene;
		this.alive = true;
		this.animationTime = 0;

		this.bossRoot =
			new TransformNode(
				"beholder",
				bossScene);

		this.bossRoot.position =
			new Vector3(
				0,
				5,
				60);

		this.createBody(bossScene);
		this.createCentralEye(bossScene);
		this.createTentacles(bossScene);
	}

	/**
	 * Updates boss movement and tentacle animation.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 * @param {Vector3} playerPosition
	 * The player's current position for tracking.
	 */
	update(
		deltaTime: number,
		playerPosition: Vector3): void
	{
		if (!this.alive || this.bossRoot === null)
		{
			return;
		}

		this.animationTime += deltaTime;

		const speed: number =
			this.isRageMode()
				? BOSS_SPEED * 2
				: BOSS_SPEED;

		const direction: Vector3 =
			playerPosition
				.subtract(this.bossRoot.position);

		if (direction.length() > 15)
		{
			direction
				.normalize();

			this.bossRoot.position.addInPlace(
				direction.scale(speed * deltaTime));
		}

		this.animateTentacles();
	}

	/**
	 * Damages a specific eye tentacle.
	 * @param {number} eyeIndex
	 * The index of the eye to damage (0-based).
	 */
	damageEye(eyeIndex: number): void
	{
		if (eyeIndex < 0 || eyeIndex >= this.eyes.length)
		{
			return;
		}

		const eye: BossEye =
			this.eyes[eyeIndex];

		if (eye.destroyed)
		{
			return;
		}

		eye.destroyed = true;
		eye.mesh.isVisible = false;

		for (const segment of eye.segments)
		{
			segment.isVisible = false;
		}

		if (this.getRemainingEyes() === 0)
		{
			this.alive = false;
		}
	}

	/**
	 * Returns whether the boss is still alive.
	 * @returns {boolean}
	 * True if the boss has remaining eyes.
	 */
	isAlive(): boolean
	{
		return this.alive;
	}

	/**
	 * Returns whether the boss is in rage mode (half or fewer eyes remaining).
	 * @returns {boolean}
	 * True if rage mode is active.
	 */
	isRageMode(): boolean
	{
		const remaining: number =
			this.getRemainingEyes();

		return this.alive && remaining <= BOSS_HEALTH / 2;
	}

	/**
	 * Returns the number of remaining (undestroyed) eyes.
	 * @returns {number}
	 * Count of active eyes.
	 */
	getRemainingEyes(): number
	{
		return this
			.eyes
			.filter(
				(eye: BossEye) => !eye.destroyed)
			.length;
	}

	/**
	 * Returns the boss's current position.
	 * @returns {Vector3}
	 * The boss root position or zero if not spawned.
	 */
	getBossPosition(): Vector3
	{
		if (this.bossRoot === null)
		{
			return Vector3.Zero();
		}

		return this.bossRoot.position.clone();
	}

	/**
	 * Returns the eye meshes for collision registration.
	 * @returns {Mesh[]}
	 * Array of active eye meshes.
	 */
	getEyeMeshes(): Mesh[]
	{
		return this
			.eyes
			.filter(
				(eye: BossEye) => !eye.destroyed)
			.map(
				(eye: BossEye) => eye.mesh);
	}

	/**
	 * Disposes all boss meshes and resources.
	 */
	dispose(): void
	{
		for (const eye of this.eyes)
		{
			eye.mesh.dispose();

			for (const segment of eye.segments)
			{
				segment.dispose();
			}
		}

		this.eyes = [];

		if (this.centralEye !== null)
		{
			this.centralEye.dispose();
			this.centralEye = null;
		}

		if (this.bodyMesh !== null)
		{
			this.bodyMesh.dispose();
			this.bodyMesh = null;
		}

		if (this.bossRoot !== null)
		{
			this.bossRoot.dispose();
			this.bossRoot = null;
		}

		this.alive = false;
		this.scene = null;
	}

	/**
	 * Creates the main body sphere of the Beholder.
	 * @param {Scene} bossScene
	 * The Babylon.js scene.
	 * @private
	 */
	private createBody(bossScene: Scene): void
	{
		this.bodyMesh =
			MeshBuilder.CreateSphere(
				"beholderBody",
				{
					diameter: 6,
					segments: 16
				},
				bossScene);

		const material: StandardMaterial =
			new StandardMaterial(
				"beholderBodyMat",
				bossScene);

		material.diffuseColor =
			new Color3(
				0.3,
				0.15,
				0.25);
		material.specularColor =
			new Color3(
				0.1,
				0.1,
				0.1);

		this.bodyMesh.material = material;
		this.bodyMesh.parent =
			this.bossRoot;
	}

	/**
	 * Creates the large central cosmetic eye.
	 * @param {Scene} bossScene
	 * The Babylon.js scene.
	 * @private
	 */
	private createCentralEye(bossScene: Scene): void
	{
		this.centralEye =
			MeshBuilder.CreateSphere(
				"beholderCentralEye",
				{
					diameter: 2,
					segments: 12
				},
				bossScene);

		const material: StandardMaterial =
			new StandardMaterial(
				"centralEyeMat",
				bossScene);

		material.emissiveColor =
			new Color3(
				0.8,
				0.9,
				0.2);
		material.diffuseColor =
			new Color3(
				0.9,
				0.95,
				0.3);

		this.centralEye.material = material;

		this.centralEye.position =
			new Vector3(
				0,
				0,
				-3);
		this.centralEye.parent =
			this.bossRoot;
	}

	/**
	 * Creates all eye tentacles around the boss body.
	 * @param {Scene} bossScene
	 * The Babylon.js scene.
	 * @private
	 */
	private createTentacles(bossScene: Scene): void
	{
		for (let idx: number = 0; idx < BOSS_EYE_COUNT; idx++)
		{
			const angle: number =
				(idx / BOSS_EYE_COUNT) * Math.PI * 2;
			const elevation: number =
				(idx % 2 === 0) ? 0.3 : -0.2;

			const basePosition: Vector3 =
				new Vector3(
					Math.cos(angle) * 3,
					2 + elevation,
					Math.sin(angle) * 3);

			const segments: Mesh[] =
				this.createTentacleSegments(
					bossScene,
					idx,
					basePosition);

			const eyeMesh: Mesh =
				this.createEyeball(
					bossScene,
					idx,
					segments);

			const eye: BossEye =
				{
					mesh: eyeMesh,
					segments,
					destroyed: false,
					phaseOffset: idx * 0.7
				};

			this.eyes.push(eye);
		}
	}

	/**
	 * Creates the chain of segments for one tentacle.
	 * @param {Scene} bossScene
	 * The Babylon.js scene.
	 * @param {number} tentacleIndex
	 * Index of the tentacle.
	 * @param {Vector3} basePosition
	 * Starting position of the tentacle.
	 * @returns {Mesh[]}
	 * Array of segment meshes.
	 * @private
	 */
	private createTentacleSegments(
		bossScene: Scene,
		tentacleIndex: number,
		basePosition: Vector3): Mesh[]
	{
		const segmentCount: number = 5;
		const segments: Mesh[] = [];

		const material: StandardMaterial =
			new StandardMaterial(
				`tentacleMat_${tentacleIndex}`,
				bossScene);

		material.diffuseColor =
			new Color3(
				0.35,
				0.2,
				0.3);

		for (let seg: number = 0; seg < segmentCount; seg++)
		{
			const segment: Mesh =
				MeshBuilder.CreateCylinder(
					`tentacle_${tentacleIndex}_${seg}`,
					{
						height: 0.6,
						diameter: 0.3 - seg * 0.03
					},
					bossScene);

			segment.material = material;

			const segOffset: Vector3 =
				basePosition.add(
					new Vector3(
						0,
						seg * 0.5,
						0));

			segment.position = segOffset;
			segment.parent =
				this.bossRoot;
			segments.push(segment);
		}

		return segments;
	}

	/**
	 * Creates an eyeball mesh at the end of a tentacle.
	 * @param {Scene} bossScene
	 * The Babylon.js scene.
	 * @param {number} tentacleIndex
	 * Index of the tentacle.
	 * @param {Mesh[]} segments
	 * The tentacle segments (eye placed at tip).
	 * @returns {Mesh}
	 * The created eye mesh.
	 * @private
	 */
	private createEyeball(
		bossScene: Scene,
		tentacleIndex: number,
		segments: Mesh[]): Mesh
	{
		const eyeMesh: Mesh =
			MeshBuilder.CreateSphere(
				`bossEye_${tentacleIndex}`,
				{
					diameter: 0.5,
					segments: 8
				},
				bossScene);

		const material: StandardMaterial =
			new StandardMaterial(
				`eyeMat_${tentacleIndex}`,
				bossScene);

		material.emissiveColor =
			new Color3(
				0.9,
				0.2,
				0.1);
		material.diffuseColor =
			new Color3(
				1,
				0.9,
				0.8);

		eyeMesh.material = material;

		if (segments.length > 0)
		{
			const lastSegment: Mesh =
				segments[segments.length - 1];

			eyeMesh.position =
				lastSegment.position.add(
					new Vector3(
						0,
						0.4,
						0));
		}

		eyeMesh.parent =
			this.bossRoot;

		return eyeMesh;
	}

	/**
	 * Animates tentacle segments with sinusoidal writhing.
	 * @private
	 */
	private animateTentacles(): void
	{
		const amplitude: number =
			this.isRageMode() ? 0.4 : 0.2;

		for (const eye of this.eyes)
		{
			if (eye.destroyed)
			{
				continue;
			}

			for (let seg: number = 0; seg < eye.segments.length; seg++)
			{
				const segment: Mesh =
					eye.segments[seg];
				const wave: number =
					Math.sin(this.animationTime * 3 + eye.phaseOffset + seg * 0.5);

				segment.position.x += wave * amplitude * 0.05;
			}
		}
	}
}