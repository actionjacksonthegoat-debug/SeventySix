// <copyright file="airplane.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Airplane Service — owns airplane mesh creation, takeoff animation, and engine audio coordination.
 * Domain-scoped — provided via route `providers` array.
 */

import { inject, Injectable } from "@angular/core";
import { Animation } from "@babylonjs/core/Animations/animation";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import {
	AIRPLANE_CLIMB_ALTITUDE,
	AIRPLANE_CLIMB_DISTANCE,
	AIRPLANE_FUSELAGE_LENGTH,
	AIRPLANE_PARKED_ROTATION_Y,
	AIRPLANE_PARKED_Y,
	AIRPLANE_RUNWAY_ACCELERATION_DISTANCE,
	AIRPLANE_TAKEOFF_DURATION_SECONDS,
	AIRPLANE_WING_SPAN,
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_RUNWAY_LENGTH,
	ISLAND_GROUND_Y
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";

/** Fuselage body color (white). */
const FUSELAGE_COLOR: string = "#FFFFFF";

/** Wing and tail color (silver). */
const WING_COLOR: string = "#C0C0C0";

/** Frame rate for takeoff animations. */
const ANIMATION_FRAME_RATE: number = 30;

/** Fraction of total animation when liftoff begins (0-1). */
const LIFTOFF_FRACTION: number = 0.4;

/** Fraction of total animation when plane leaves island (0-1). */
const LEAVES_ISLAND_FRACTION: number = 0.7;

@Injectable()
export class AirplaneService
{
	/** Reference to the active Babylon.js scene. */
	private sceneRef: Scene | null = null;

	/** The airplane root mesh. */
	private airplaneMesh: Mesh | null = null;

	/** Audio service for engine sound effects. */
	private readonly audioService: SpyAudioService =
		inject(SpyAudioService);

	/**
	 * Stores the scene reference for later use.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	initialize(scene: Scene): void
	{
		this.sceneRef = scene;
	}

	/**
	 * Creates a parked airplane on the runway at initialization time.
	 * The airplane is oriented facing west (−X) at the east end for westward takeoff.
	 * @returns
	 * The airplane TransformNode for camera targeting.
	 */
	createParkedAirplane(): TransformNode
	{
		const node: TransformNode =
			this.createAirplane();

		return node;
	}

	/**
	 * Builds a procedural airplane mesh and positions it at the east end of the runway facing west.
	 * @returns
	 * The airplane TransformNode for camera targeting.
	 */
	createAirplane(): TransformNode
	{
		if (this.sceneRef == null)
		{
			throw new Error("AirplaneService: initialize() must be called before createAirplane().");
		}

		const scene: Scene =
			this.sceneRef;

		const { fuselage, material: fuselageMaterial } =
			this.createFuselageParts(scene);
		const { wings, tailFin } =
			this.createWingParts(scene);

		/* Nose cone at front (+Z end). */
		const noseCone: Mesh =
			MeshBuilder.CreateCylinder(
				"airplane-nose",
				{
					height: 1.5,
					diameterTop: 0,
					diameterBottom: 1.2,
					tessellation: 12
				},
				scene);

		noseCone.rotation.x =
			Math.PI / 2;
		noseCone.position.z =
			AIRPLANE_FUSELAGE_LENGTH / 2 + 0.5;
		noseCone.material = fuselageMaterial;

		/* Merge into a single mesh. */
		const merged: Mesh | null =
			Mesh.MergeMeshes(
				[fuselage, wings, tailFin, noseCone],
				true,
				true,
				undefined,
				false,
				true);

		if (merged != null)
		{
			merged.name = "airplane";
			merged.position.x =
				AIRSTRIP_CENTER_X + AIRSTRIP_RUNWAY_LENGTH / 2 - AIRPLANE_FUSELAGE_LENGTH;
			merged.position.y =
				ISLAND_GROUND_Y + AIRPLANE_PARKED_Y;
			merged.position.z = AIRSTRIP_CENTER_Z;
			merged.rotation.y =
				AIRPLANE_PARKED_ROTATION_Y;

			this.airplaneMesh = merged;
		}

		return this.airplaneMesh!;
	}

	/**
	 * Creates the fuselage cylinder and its material.
	 * @param scene
	 * The active Babylon.js scene.
	 * @returns
	 * The fuselage mesh and shared material.
	 */
	private createFuselageParts(scene: Scene): { fuselage: Mesh; material: StandardMaterial; }
	{
		const fuselage: Mesh =
			MeshBuilder.CreateCylinder(
				"airplane-fuselage",
				{
					height: AIRPLANE_FUSELAGE_LENGTH,
					diameter: 1.2,
					tessellation: 12
				},
				scene);

		fuselage.rotation.x =
			Math.PI / 2;

		const material: StandardMaterial =
			new StandardMaterial("airplane-fuselage-mat", scene);

		material.diffuseColor =
			Color3.FromHexString(FUSELAGE_COLOR);
		fuselage.material = material;

		return { fuselage, material };
	}

	/**
	 * Creates the wings and tail fin meshes with shared wing material.
	 * @param scene
	 * The active Babylon.js scene.
	 * @returns
	 * The wings and tail fin meshes.
	 */
	private createWingParts(scene: Scene): { wings: Mesh; tailFin: Mesh; }
	{
		const wingMaterial: StandardMaterial =
			new StandardMaterial("airplane-wing-mat", scene);

		wingMaterial.diffuseColor =
			Color3.FromHexString(WING_COLOR);

		/* Wings — flat box spanning both sides (along X axis). */
		const wings: Mesh =
			MeshBuilder.CreateBox(
				"airplane-wings",
				{
					width: AIRPLANE_WING_SPAN,
					height: 0.15,
					depth: 1.5
				},
				scene);

		wings.material = wingMaterial;
		wings.position.z = -0.5;

		/* Tail fin — vertical box at the rear (negative Z end). */
		const tailFin: Mesh =
			MeshBuilder.CreateBox(
				"airplane-tail",
				{
					width: 0.15,
					height: 1.5,
					depth: 1
				},
				scene);

		tailFin.material = wingMaterial;
		tailFin.position.y = 0.75;
		tailFin.position.z =
			-AIRPLANE_FUSELAGE_LENGTH / 2 + 0.5;

		return { wings, tailFin };
	}

	/**
	 * Plays a multi-phase takeoff animation: runway roll, liftoff, and climb-away.
	 * @param onLeavesIsland
	 * Callback invoked when the plane clears the island edge (~70% of animation).
	 * @param onComplete
	 * Callback invoked when the animation finishes completely.
	 */
	animateTakeoff(
		onLeavesIsland: () => void,
		onComplete: () => void): void
	{
		if (this.airplaneMesh == null || this.sceneRef == null)
		{
			onLeavesIsland();
			onComplete();
			return;
		}

		const totalFrames: number =
			ANIMATION_FRAME_RATE * AIRPLANE_TAKEOFF_DURATION_SECONDS;
		const liftoffFrame: number =
			Math.round(totalFrames * LIFTOFF_FRACTION);
		const leavesFrame: number =
			Math.round(totalFrames * LEAVES_ISLAND_FRACTION);

		const startPos: Vector3 =
			this.airplaneMesh.position.clone();

		/* Position animation: runway roll west (−X) → liftoff → climb-away. */
		const positionAnim: Animation =
			new Animation(
				"airplane-takeoff-pos",
				"position",
				ANIMATION_FRAME_RATE,
				Animation.ANIMATIONTYPE_VECTOR3,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		positionAnim.setKeys(
			[
				{
					frame: 0,
					value: startPos
				},
				{
					frame: liftoffFrame,
					value: new Vector3(
						startPos.x - AIRPLANE_RUNWAY_ACCELERATION_DISTANCE,
						startPos.y,
						startPos.z)
				},
				{
					frame: leavesFrame,
					value: new Vector3(
						startPos.x - AIRPLANE_RUNWAY_ACCELERATION_DISTANCE - AIRPLANE_CLIMB_DISTANCE * 0.5,
						startPos.y + AIRPLANE_CLIMB_ALTITUDE * 0.4,
						startPos.z)
				},
				{
					frame: totalFrames,
					value: new Vector3(
						startPos.x - AIRPLANE_RUNWAY_ACCELERATION_DISTANCE - AIRPLANE_CLIMB_DISTANCE,
						startPos.y + AIRPLANE_CLIMB_ALTITUDE,
						startPos.z)
				}
			]);

		/* Rotation animation: nose-up pitch during liftoff (rotation.z for +X facing). */
		const rotationAnim: Animation =
			new Animation(
				"airplane-takeoff-rot",
				"rotation.z",
				ANIMATION_FRAME_RATE,
				Animation.ANIMATIONTYPE_FLOAT,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		rotationAnim.setKeys(
			[
				{
					frame: 0,
					value: 0
				},
				{
					frame: liftoffFrame,
					value: 0
				},
				{
					frame: leavesFrame,
					value: -Math.PI / 8
				},
				{
					frame: totalFrames,
					value: -Math.PI / 5
				}
			]);

		/* Track when the plane leaves the island. */
		let hasCalledLeavesIsland: boolean = false;
		const leavesObserver: ReturnType<typeof this.sceneRef.onBeforeRenderObservable.add> =
			this
				.sceneRef
				.onBeforeRenderObservable
				.add(
					() =>
					{
						if (
							!hasCalledLeavesIsland
								&& this.airplaneMesh != null
								&& this.airplaneMesh.position.y > startPos.y + AIRPLANE_CLIMB_ALTITUDE * 0.3)
						{
							hasCalledLeavesIsland = true;
							onLeavesIsland();
						}
					});

		this.audioService.playEngineStartup();

		this.sceneRef.beginDirectAnimation(
			this.airplaneMesh,
			[positionAnim, rotationAnim],
			0,
			totalFrames,
			false,
			1,
			() =>
			{
				if (this.sceneRef != null && leavesObserver != null)
				{
					this.sceneRef.onBeforeRenderObservable.remove(leavesObserver);
				}

				if (!hasCalledLeavesIsland)
				{
					onLeavesIsland();
				}

				this.audioService.stopEngine();
				onComplete();
			});
	}

	/**
	 * Disposes airplane mesh and clears references.
	 */
	dispose(): void
	{
		if (this.airplaneMesh != null)
		{
			this.airplaneMesh.dispose();
			this.airplaneMesh = null;
		}

		this.sceneRef = null;
	}
}