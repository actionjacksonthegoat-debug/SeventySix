/**
 * Octopus Boss Service.
 * Builds a cartoon octopus obstacle with curvy arms that the kart jumps over.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import {
	APPROACH_TRIGGER_DISTANCE,
	OCTOPUS_BODY_COLOR,
	OCTOPUS_BODY_DIAMETER,
	OCTOPUS_BODY_SCALE_Y,
	OCTOPUS_BOW_COLOR,
	OCTOPUS_COLLISION_RADIUS,
	OCTOPUS_EMISSIVE_COLOR,
	OCTOPUS_JUMP_DURATION,
	OCTOPUS_JUMP_HEIGHT,
	OCTOPUS_SQUASH_STRETCH_FACTOR,
	TENTACLE_COLOR,
	TENTACLE_COUNT,
	TENTACLE_LENGTH,
	TENTACLE_SEGMENT_COUNT,
	TENTACLE_SWAY_AMPLITUDE,
	TENTACLE_SWAY_PERIOD,
	TENTACLE_WIDTH
} from "@games/car-a-lot/constants/car-a-lot.constants";

/** Phase offset between tentacle sway animation (radians). */
const TENTACLE_PHASE_OFFSET: number =
	(Math.PI * 2) / TENTACLE_COUNT;

/** Number of segments per tentacle. */
const SEGMENTS_PER_TENTACLE: number =
	TENTACLE_SEGMENT_COUNT;

/** Maximum pupil tracking offset from center. */
const MAX_PUPIL_OFFSET: number = 1.5;

/** Suction cup diameter on tentacle undersides. */
const SUCTION_CUP_DIAMETER: number = 0.8;

/**
 * Tentacle data for animation.
 */
interface TentacleData
{
	/** Tentacle segment meshes. */
	segments: Mesh[];

	/** Base position at the octopus body. */
	basePosition: Vector3;

	/** Heading angle of the tentacle. */
	heading: number;

	/** Phase offset for sway animation. */
	phaseOffset: number;
}

/**
 * Builds and manages the cartoon octopus boss obstacle.
 * Creates curvy arms with suction cups and eye tracking.
 * The kart must jump over the octopus body to proceed.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class OctopusBossService
{
	/** All octopus meshes for disposal. */
	private readonly meshes: Mesh[] = [];

	/** Tentacle data for animation. */
	private readonly tentacles: TentacleData[] = [];

	/** Octopus body center position. */
	private bodyCenter: Vector3 =
		Vector3.Zero();

	/** Whether the octopus has been created. */
	private created: boolean = false;

	/** Elapsed time for animation. */
	private elapsedTime: number = 0;

	/** Eye meshes for pupil tracking. */
	private readonly eyePupils: Mesh[] = [];

	/** Original pupil positions for bounded tracking. */
	private readonly pupilOrigins: Vector3[] = [];

	/** Whether the octopus jump attack is active. */
	private isJumpAttack: boolean = false;

	/** Progress of the jump attack animation (0 to 1+). */
	private jumpAttackProgress: number = 0;

	/** Reference to the body mesh for jump animation scaling. */
	private bodyMesh: Mesh | null = null;

	/**
	 * Create the entire octopus at the given position.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * World position for the octopus body center.
	 */
	createOctopus(
		scene: Scene,
		position: Vector3): void
	{
		this.bodyCenter =
			position.clone();
		this.created = true;

		this.createBody(scene, position);
		this.createEyes(scene, position);
		this.createBow(scene, position);
		this.createTentacles(scene, position);
	}

	/**
	 * Update tentacle curvy sway animation.
	 * A sine wave travels along each tentacle with per-segment phase offset.
	 * @param deltaTime
	 * Time elapsed since the last frame in seconds.
	 */
	updateAnimation(deltaTime: number): void
	{
		this.elapsedTime += deltaTime;

		for (const tentacle of this.tentacles)
		{
			const timePhase: number =
				(this.elapsedTime / TENTACLE_SWAY_PERIOD) * Math.PI * 2
					+ tentacle.phaseOffset;

			for (const [segIndex, segment] of tentacle.segments.entries())
			{
				const segFraction: number =
					segIndex / tentacle.segments.length;
				const wavePhase: number =
					timePhase - segFraction * Math.PI * 3;
				const swayOffset: number =
					Math.sin(wavePhase) * TENTACLE_SWAY_AMPLITUDE * segFraction;
				const verticalOffset: number =
					Math.cos(wavePhase * 0.7) * TENTACLE_SWAY_AMPLITUDE * 0.3 * segFraction;

				const perpX: number =
					Math.cos(tentacle.heading);
				const perpZ: number =
					-Math.sin(tentacle.heading);

				segment.position.x += perpX * swayOffset * deltaTime;
				segment.position.z += perpZ * swayOffset * deltaTime;
				segment.position.y += verticalOffset * deltaTime;
			}
		}
	}

	/**
	 * Get the current positions of all tentacle tips for animation verification.
	 * @returns
	 * Array of tentacle tip positions.
	 */
	getTentaclePositions(): Vector3[]
	{
		return this.tentacles.map(
			(tentacle) =>
			{
				const lastSegment: Mesh =
					tentacle.segments[tentacle.segments.length - 1];
				return lastSegment.position.clone();
			});
	}

	/**
	 * Check if the kart is in the octopus approach zone for jump prompt.
	 * @param kartPosition
	 * Current kart world position.
	 * @returns
	 * True if the kart is approaching the octopus.
	 */
	checkApproachZone(kartPosition: Vector3): boolean
	{
		if (!this.created)
		{
			return false;
		}

		const approachStart: number =
			this.bodyCenter.z - APPROACH_TRIGGER_DISTANCE;

		return kartPosition.z >= approachStart
			&& kartPosition.z < this.bodyCenter.z;
	}

	/**
	 * Check if the kart has cleared the octopus body.
	 * @param kartPosition
	 * Current kart world position.
	 * @returns
	 * True if the kart is behind the octopus.
	 */
	hasCleared(kartPosition: Vector3): boolean
	{
		if (!this.created)
		{
			return false;
		}

		return kartPosition.z > this.bodyCenter.z + OCTOPUS_BODY_DIAMETER / 2;
	}

	/**
	 * Check if the kart collides with the octopus body during a jump.
	 * Uses an ellipsoid approximation of the body shape.
	 * @param kartPosition
	 * Current kart world position.
	 * @returns
	 * True if the kart is inside the octopus body collision zone.
	 */
	checkBodyCollision(kartPosition: Vector3): boolean
	{
		if (!this.created)
		{
			return false;
		}

		const bodyCenterY: number =
			OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y / 2;
		const deltaX: number =
			kartPosition.x - this.bodyCenter.x;
		const deltaY: number =
			kartPosition.y - bodyCenterY;
		const deltaZ: number =
			kartPosition.z - this.bodyCenter.z;

		const horizontalDist: number =
			Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
		const verticalDist: number =
			Math.abs(deltaY) / OCTOPUS_BODY_SCALE_Y;

		const effectiveDist: number =
			Math.sqrt(horizontalDist * horizontalDist + verticalDist * verticalDist);

		return effectiveDist < OCTOPUS_COLLISION_RADIUS;
	}

	/**
	 * Update eye pupil tracking toward the kart.
	 * Pupils track within bounded offsets to stay inside eye whites.
	 * @param kartPosition
	 * Current kart world position.
	 */
	updateEyeTracking(kartPosition: Vector3): void
	{
		for (const [index, pupil] of this.eyePupils.entries())
		{
			const origin: Vector3 =
				this.pupilOrigins[index];
			const direction: Vector3 =
				kartPosition
					.subtract(origin)
					.normalize();

			pupil.position.x =
				origin.x + direction.x * MAX_PUPIL_OFFSET;
			pupil.position.z =
				origin.z + direction.z * MAX_PUPIL_OFFSET;
		}
	}

	/**
	 * Start the octopus jump attack animation.
	 * The octopus leaps into the air and lands on the kart.
	 */
	startJumpAttack(): void
	{
		this.isJumpAttack = true;
		this.jumpAttackProgress = 0;
	}

	/**
	 * Update the jump attack animation each frame.
	 * Uses a parabolic arc for height and squash/stretch for body scaling.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 * @returns
	 * Object with `landed` flag and current body `position`.
	 */
	updateJumpAttack(deltaTime: number): { landed: boolean; position: Vector3; }
	{
		if (!this.isJumpAttack)
		{
			return {
				landed: false,
				position: this.bodyCenter.clone()
			};
		}

		this.jumpAttackProgress += deltaTime / OCTOPUS_JUMP_DURATION;

		const clampedProgress: number =
			Math.min(this.jumpAttackProgress, 1);
		const arcHeight: number =
			OCTOPUS_JUMP_HEIGHT * 4 * clampedProgress * (1 - clampedProgress);

		if (this.bodyMesh !== null)
		{
			this.bodyMesh.position.y =
				OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y / 2 + arcHeight;

			const stretchY: number =
				1 + OCTOPUS_SQUASH_STRETCH_FACTOR * Math.sin(clampedProgress * Math.PI);
			const squashXZ: number =
				1 - OCTOPUS_SQUASH_STRETCH_FACTOR * 0.5 * Math.sin(clampedProgress * Math.PI);

			this.bodyMesh.scaling.x = squashXZ;
			this.bodyMesh.scaling.y =
				OCTOPUS_BODY_SCALE_Y * stretchY;
			this.bodyMesh.scaling.z = squashXZ;
		}

		const landed: boolean =
			this.jumpAttackProgress >= 1;

		if (landed)
		{
			this.isJumpAttack = false;
		}

		return {
			landed,
			position: this.bodyMesh !== null
				? this.bodyMesh.position.clone()
				: this.bodyCenter.clone()
		};
	}

	/**
	 * Whether the octopus jump attack is currently playing.
	 * @returns
	 * True if the octopus is mid-jump.
	 */
	getIsJumpAttacking(): boolean
	{
		return this.isJumpAttack;
	}

	/**
	 * Dispose all octopus meshes.
	 */
	dispose(): void
	{
		for (const mesh of this.meshes)
		{
			mesh.dispose();
		}

		this.meshes.length = 0;
		this.tentacles.length = 0;
		this.eyePupils.length = 0;
		this.pupilOrigins.length = 0;
		this.created = false;
		this.isJumpAttack = false;
		this.jumpAttackProgress = 0;
		this.bodyMesh = null;
	}

	/**
	 * Create the main octopus body sphere.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * Body center position.
	 */
	private createBody(
		scene: Scene,
		position: Vector3): void
	{
		const body: Mesh =
			MeshBuilder.CreateSphere(
				"octopus-body",
				{
					diameter: OCTOPUS_BODY_DIAMETER,
					segments: 16
				},
				scene);

		const bodyMaterial: StandardMaterial =
			new StandardMaterial("octopus-body-mat", scene);

		bodyMaterial.diffuseColor =
			OCTOPUS_BODY_COLOR.clone();
		bodyMaterial.emissiveColor =
			OCTOPUS_EMISSIVE_COLOR.clone();
		bodyMaterial.specularColor =
			new Color3(0.15, 0.15, 0.2);

		body.position =
			new Vector3(
				position.x,
				OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y / 2,
				position.z);
		body.scaling.y =
			OCTOPUS_BODY_SCALE_Y;
		body.material = bodyMaterial;

		this.meshes.push(body);
		this.bodyMesh = body;
	}

	/**
	 * Create the octopus eyes with pupils that track the kart.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * Body center position.
	 */
	private createEyes(
		scene: Scene,
		position: Vector3): void
	{
		const whiteMat: StandardMaterial =
			new StandardMaterial("octopus-eye-white-mat", scene);

		whiteMat.diffuseColor =
			new Color3(1, 1, 1);
		whiteMat.emissiveColor =
			new Color3(0.3, 0.3, 0.3);

		const pupilMat: StandardMaterial =
			new StandardMaterial("octopus-pupil-mat", scene);

		pupilMat.diffuseColor =
			new Color3(0.02, 0.02, 0.02);

		const bodyHeight: number =
			OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y;

		for (const side of [-1, 1])
		{
			this.createSingleEye(
				scene,
				position,
				side,
				bodyHeight,
				{ whiteMat, pupilMat });
		}
	}

	/**
	 * Create one eye (white + pupil) on the given side.
	 * @param scene The Babylon.js Scene.
	 * @param position Body center position.
	 * @param side -1 for left, 1 for right.
	 * @param bodyHeight Computed body height.
	 * @param materials Eye white and pupil materials.
	 */
	private createSingleEye(
		scene: Scene,
		position: Vector3,
		side: number,
		bodyHeight: number,
		materials: { whiteMat: StandardMaterial; pupilMat: StandardMaterial; }): void
	{
		const label: string =
			side > 0 ? "right" : "left";
		const eyeSpacing: number = 5;

		const eyeWhite: Mesh =
			MeshBuilder.CreateSphere(
				`octopus-eye-white-${label}`,
				{ diameter: 7, segments: 12 },
				scene);

		eyeWhite.position =
			new Vector3(
				position.x + eyeSpacing * side,
				bodyHeight * 0.7,
				position.z - OCTOPUS_BODY_DIAMETER * 0.35);
		eyeWhite.material =
			materials.whiteMat;
		this.meshes.push(eyeWhite);

		const pupilOrigin: Vector3 =
			new Vector3(
				position.x + eyeSpacing * side,
				bodyHeight * 0.7,
				position.z - OCTOPUS_BODY_DIAMETER * 0.35 - 2);

		const pupil: Mesh =
			MeshBuilder.CreateSphere(
				`octopus-eye-pupil-${label}`,
				{ diameter: 3.5, segments: 8 },
				scene);

		pupil.position =
			pupilOrigin.clone();
		pupil.material =
			materials.pupilMat;
		this.meshes.push(pupil);
		this.eyePupils.push(pupil);
		this.pupilOrigins.push(pupilOrigin.clone());
	}

	/**
	 * Create the pink bow on top of the body.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * Body center position.
	 */
	private createBow(
		scene: Scene,
		position: Vector3): void
	{
		const bowMaterial: StandardMaterial =
			new StandardMaterial("octopus-bow-mat", scene);

		bowMaterial.diffuseColor =
			OCTOPUS_BOW_COLOR.clone();
		bowMaterial.emissiveColor =
			new Color3(0.2, 0.05, 0.1);

		const bodyHeight: number =
			OCTOPUS_BODY_DIAMETER * OCTOPUS_BODY_SCALE_Y;

		for (const side of [-1, 1])
		{
			const ribbon: Mesh =
				MeshBuilder.CreateBox(
					`octopus-bow-ribbon-${side > 0 ? "right" : "left"}`,
					{
						width: 5,
						height: 1.5,
						depth: 2.5
					},
					scene);

			ribbon.position =
				new Vector3(
					position.x + 4 * side,
					bodyHeight + 0.5,
					position.z);
			ribbon.rotation.z =
				0.3 * side;
			ribbon.material = bowMaterial;

			this.meshes.push(ribbon);
		}

		const bowCenter: Mesh =
			MeshBuilder.CreateSphere(
				"octopus-bow-center",
				{
					diameter: 2,
					segments: 8
				},
				scene);

		bowCenter.position =
			new Vector3(
				position.x,
				bodyHeight + 0.5,
				position.z);
		bowCenter.material = bowMaterial;

		this.meshes.push(bowCenter);
	}

	/**
	 * Create all tentacle arms as curvy cartoon-style appendages with suction cups.
	 * 8 arms distributed around the octopus with S-curve shapes.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * Body center position.
	 */
	private createTentacles(
		scene: Scene,
		position: Vector3): void
	{
		const tentacleMaterial: StandardMaterial =
			new StandardMaterial("tentacle-mat", scene);

		tentacleMaterial.diffuseColor =
			TENTACLE_COLOR.clone();
		tentacleMaterial.specularColor =
			new Color3(0.1, 0.1, 0.1);

		const suctionMaterial: StandardMaterial =
			new StandardMaterial("suction-cup-mat", scene);

		suctionMaterial.diffuseColor =
			new Color3(0.95, 0.65, 0.8);
		suctionMaterial.emissiveColor =
			new Color3(0.1, 0.03, 0.05);

		const bodyRadius: number =
			OCTOPUS_BODY_DIAMETER / 2;

		for (let tentIndex: number = 0; tentIndex < TENTACLE_COUNT; tentIndex++)
		{
			const heading: number =
				(tentIndex / TENTACLE_COUNT) * Math.PI * 2;

			const tipX: number =
				position.x - Math.sin(heading) * (bodyRadius * 0.8 + TENTACLE_LENGTH);
			const tipZ: number =
				position.z - Math.cos(heading) * (bodyRadius * 0.8 + TENTACLE_LENGTH);

			if (tipZ > position.z && Math.abs(tipX - position.x) < TENTACLE_WIDTH * 3)
			{
				continue;
			}

			this.createSingleTentacle(
				scene,
				position,
				tentIndex,
				heading,
				{ tentacleMat: tentacleMaterial, suctionMat: suctionMaterial, bodyRadius });
		}
	}

	/**
	 * Create one cartoon tentacle arm with S-curve segments and suction cups.
	 * @param scene The Babylon.js Scene.
	 * @param position Body center position.
	 * @param tentIndex Index of this tentacle.
	 * @param heading Angle around the body.
	 * @param mats Tentacle materials and body radius.
	 */
	private createSingleTentacle(
		scene: Scene,
		position: Vector3,
		tentIndex: number,
		heading: number,
		mats: { tentacleMat: StandardMaterial; suctionMat: StandardMaterial; bodyRadius: number; }): void
	{
		const baseX: number =
			position.x - Math.sin(heading) * mats.bodyRadius * 0.8;
		const baseZ: number =
			position.z - Math.cos(heading) * mats.bodyRadius * 0.8;

		const segmentLength: number =
			TENTACLE_LENGTH / SEGMENTS_PER_TENTACLE;

		const tentacleData: TentacleData =
			{
				segments: [],
				basePosition: new Vector3(baseX, 0, baseZ),
				heading,
				phaseOffset: tentIndex * TENTACLE_PHASE_OFFSET
			};

		for (let segIndex: number = 0; segIndex < SEGMENTS_PER_TENTACLE; segIndex++)
		{
			const along: number =
				segIndex * segmentLength;
			const curveFactor: number =
				Math.sin((segIndex / SEGMENTS_PER_TENTACLE) * Math.PI) * 3;

			const segX: number =
				baseX - Math.sin(heading) * along + Math.cos(heading) * curveFactor;
			const segZ: number =
				baseZ - Math.cos(heading) * along - Math.sin(heading) * curveFactor;

			const taperFactor: number =
				1 - (segIndex / SEGMENTS_PER_TENTACLE) * 0.6;
			const riseFactor: number =
				1 - (segIndex / SEGMENTS_PER_TENTACLE);
			const segHeight: number =
				0.1 + riseFactor * 0.3 + 0.15;

			const segment: Mesh =
				MeshBuilder.CreateCylinder(
					`tentacle-${tentIndex}-seg-${segIndex}`,
					{
						diameterTop: TENTACLE_WIDTH * taperFactor,
						diameterBottom: TENTACLE_WIDTH * taperFactor,
						height: segHeight,
						tessellation: 8
					},
					scene);

			segment.position =
				new Vector3(segX, segHeight / 2, segZ);
			segment.rotation.y = heading;
			segment.material =
				mats.tentacleMat;

			this.meshes.push(segment);
			tentacleData.segments.push(segment);

			if (segIndex % 2 === 0 && segIndex > 0)
			{
				const cup: Mesh =
					MeshBuilder.CreateSphere(
						`suction-${tentIndex}-${segIndex}`,
						{
							diameter: SUCTION_CUP_DIAMETER * taperFactor,
							segments: 6
						},
						scene);

				cup.position =
					new Vector3(segX, 0.05, segZ);
				cup.material =
					mats.suctionMat;
				this.meshes.push(cup);
			}
		}

		this.tentacles.push(tentacleData);
	}
}