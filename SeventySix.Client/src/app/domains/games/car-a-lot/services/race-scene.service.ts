/**
 * Race Scene Service.
 * Sets up the Babylon.js scene environment: sky, lighting, ground, fog, and clouds.
 */

import { Injectable } from "@angular/core";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import type { IGameSceneService } from "@games/shared/models/game-service.interfaces";

/* Side-effect imports: register StandardMaterial shader source + all #include chunks. */
/* Required for Vite dev mode — prevents HTTP fallback to index.html for .fx files. */
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";

import {
	APPROACH_ROAD_END_WIDTH,
	APPROACH_ROAD_STEPS,
	CASTLE_FLAG_COLOR,
	CASTLE_OFFSET_Z,
	CASTLE_TOWER_COLOR,
	CASTLE_TOWER_HEIGHT,
	CASTLE_WALL_COLOR,
	CASTLE_WALL_HEIGHT,
	CASTLE_WALL_WIDTH,
	GROUND_COLOR,
	LANDING_ROAD_LENGTH,
	LANDING_ROAD_WIDTH,
	OCTOPUS_SPAWN_OFFSET_Z,
	RESCUE_PLATFORM_HEIGHT,
	RESCUE_PLATFORM_RADIUS,
	RESCUE_RING_COLOR,
	ROAD_COLOR,
	ROAD_WIDTH
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { RoadSegment } from "@games/car-a-lot/models/car-a-lot.models";

/** Disposable scene object contract. */
interface Disposable
{
	/** Release resources. */
	dispose(): void;
}

/** Ground plane size in world units. */
const GROUND_SIZE: number = 500;

/** Subdivisions for terrain height variation. */
const TERRAIN_SUBDIVISIONS: number = 80;

/** Maximum hill height above water. */
const HILL_MAX_HEIGHT: number = 6;

/** Water surface Y level (hills below this are submerged). */
const WATER_LEVEL: number = -0.2;

/** Number of puffy cartoon clouds to create. */
const CLOUD_COUNT: number = 6;

/** Minimum cloud height above ground. */
const CLOUD_MIN_Y: number = 40;

/** Maximum cloud height above ground. */
const CLOUD_MAX_Y: number = 60;

/** Fog density for subtle depth haze. */
const FOG_DENSITY: number = 0.002;

/**
 * Manages the race scene environment including sky color, lighting, and ground.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class RaceSceneService implements IGameSceneService
{
	/** References to disposable scene objects. */
	private readonly disposables: Disposable[] = [];

	/** Ground mesh reference for hill updates. */
	private groundMesh: Mesh | null = null;

	/**
	 * Initialize the scene environment with sky, lighting, ground, fog, and clouds.
	 * @param scene
	 * The Babylon.js Scene to configure.
	 */
	initialize(scene: Scene): void
	{
		this.setupSkyColor(scene);
		this.createLighting(scene);
		this.createGround(scene);
		this.setupFog(scene);
		this.createClouds(scene);
	}

	/**
	 * Dispose all scene objects created by this service.
	 */
	dispose(): void
	{
		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
		this.groundMesh = null;
	}

	/**
	 * Raise ground terrain to create grassy hills along road segments.
	 * Selects every 4th segment to create distinct hill clusters.
	 * @param segments
	 * Road segments to place hills around.
	 */
	createRoadHills(segments: readonly RoadSegment[]): void
	{
		if (this.groundMesh === null)
		{
			return;
		}

		const positions: number[] | null =
			this.groundMesh.getVerticesData(VertexBuffer.PositionKind) as
			| number[]
			| null;

		if (positions === null)
		{
			return;
		}

		const hillCenters: { x: number; z: number; }[] = [];

		for (let segIdx: number = 2; segIdx < segments.length - 3; segIdx += 4)
		{
			hillCenters.push(
				{
					x: segments[segIdx].positionX,
					z: segments[segIdx].positionZ
				});
		}

		const hillRadius: number =
			ROAD_WIDTH * 2.5;

		for (let idx: number = 1; idx < positions.length; idx += 3)
		{
			const vertX: number =
				positions[idx - 1];
			const vertZ: number =
				positions[idx + 1];

			let maxInfluence: number = 0;

			for (const center of hillCenters)
			{
				const dx: number =
					vertX - center.x;
				const dz: number =
					vertZ - center.z;
				const dist: number =
					Math.sqrt(dx * dx + dz * dz);

				if (dist < hillRadius)
				{
					const falloff: number =
						1 - dist / hillRadius;
					const smoothFalloff: number =
						falloff * falloff * (3 - 2 * falloff);

					maxInfluence =
						Math.max(maxInfluence, smoothFalloff);
				}
			}

			positions[idx] =
				maxInfluence > 0
					? maxInfluence * HILL_MAX_HEIGHT
					: WATER_LEVEL;
		}

		this.groundMesh.updateVerticesData(
			VertexBuffer.PositionKind,
			positions);
	}

	/**
	 * Set the scene background to a light sky blue.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private setupSkyColor(scene: Scene): void
	{
		scene.clearColor =
			new Color4(0.53, 0.81, 0.92, 1.0);
	}

	/**
	 * Create ambient and directional lighting for outdoor feel.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createLighting(scene: Scene): void
	{
		const hemisphericLight: HemisphericLight =
			new HemisphericLight(
				"ambient-light",
				new Vector3(0, 1, 0),
				scene);

		hemisphericLight.intensity = 0.6;
		hemisphericLight.diffuse =
			new Color3(1.0, 0.98, 0.9);
		hemisphericLight.groundColor =
			new Color3(0.3, 0.5, 0.3);

		const directionalLight: DirectionalLight =
			new DirectionalLight(
				"sun-light",
				new Vector3(-0.5, -1, 0.5)
					.normalize(),
				scene);

		directionalLight.intensity = 0.8;
		directionalLight.diffuse =
			new Color3(1.0, 0.95, 0.85);

		this.disposables.push(hemisphericLight);
		this.disposables.push(directionalLight);
	}

	/**
	 * Create the ground plane at water level.
	 * Hills are raised later via `createRoadHills` once road segments are known.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createGround(scene: Scene): void
	{
		const ground: Mesh =
			MeshBuilder.CreateGround(
				"ground",
				{
					width: GROUND_SIZE,
					height: GROUND_SIZE,
					subdivisions: TERRAIN_SUBDIVISIONS
				},
				scene);

		const groundMaterial: StandardMaterial =
			new StandardMaterial(
				"ground-material",
				scene);

		groundMaterial.diffuseColor =
			GROUND_COLOR.clone();
		groundMaterial.specularColor =
			new Color3(0.1, 0.1, 0.1);

		ground.material = groundMaterial;
		ground.position.y = -0.01;

		this.groundMesh = ground;
		this.disposables.push(ground);

		this.createWaterPlane(scene);
	}

	/**
	 * Create an animated water plane with vertex-based wave simulation.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createWaterPlane(scene: Scene): void
	{
		const waterSize: number = 4000;
		const subdivisions: number = 64;

		const water: Mesh =
			MeshBuilder.CreateGround(
				"water-plane",
				{
					width: waterSize,
					height: waterSize,
					subdivisions
				},
				scene);

		const waterMaterial: StandardMaterial =
			new StandardMaterial(
				"water-material",
				scene);

		waterMaterial.diffuseColor =
			new Color3(0.05, 0.35, 0.45);
		waterMaterial.specularColor =
			new Color3(0.6, 0.6, 0.65);
		waterMaterial.specularPower = 128;
		waterMaterial.emissiveColor =
			new Color3(0.02, 0.15, 0.22);
		waterMaterial.alpha = 0.85;
		waterMaterial.backFaceCulling = false;

		water.material = waterMaterial;
		water.position.y = -0.2;

		const basePositions: Float32Array =
			new Float32Array(
				water.getVerticesData(VertexBuffer.PositionKind) as number[]);

		let elapsed: number = 0;

		const waveCallback: () => void =
			(): void =>
			{
				elapsed += 0.016;

				const positions: number[] | null =
					water.getVerticesData(VertexBuffer.PositionKind) as number[] | null;

				if (positions === null)
				{
					return;
				}

				for (let idx: number = 1; idx < positions.length; idx += 3)
				{
					const baseX: number =
						basePositions[idx - 1];
					const baseZ: number =
						basePositions[idx + 1];

					positions[idx] =
						basePositions[idx]
							+ Math.sin(baseX * 0.08 + elapsed * 1.5) * 0.5
							+ Math.cos(baseZ * 0.06 + elapsed * 1.0) * 0.35
							+ Math.sin((baseX + baseZ) * 0.04 + elapsed * 0.7) * 0.25
							+ Math.cos(baseX * 0.12 - elapsed * 2.0) * 0.15;
				}

				water.updateVerticesData(
					VertexBuffer.PositionKind,
					positions);
			};

		scene.registerBeforeRender(waveCallback);

		this.disposables.push(water);
		this.disposables.push(
			{
				dispose: (): void =>
				{
					scene.unregisterBeforeRender(waveCallback);
				}
			});
	}

	/**
	 * Create the rescue platform disc with decorative gold ring.
	 * Includes a ground plane beneath the platform to prevent floating.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * Center position for the rescue platform.
	 */
	createRescuePlatform(
		scene: Scene,
		position: Vector3): void
	{
		const groundPlane: Mesh =
			MeshBuilder.CreateGround(
				"rescue-ground",
				{
					width: RESCUE_PLATFORM_RADIUS * 3,
					height: RESCUE_PLATFORM_RADIUS * 3
				},
				scene);

		const groundMat: StandardMaterial =
			new StandardMaterial("rescue-ground-mat", scene);

		groundMat.diffuseColor =
			GROUND_COLOR.clone();
		groundMat.specularColor =
			new Color3(0.1, 0.1, 0.1);

		groundPlane.position =
			new Vector3(
				position.x,
				-0.01,
				position.z);
		groundPlane.material = groundMat;
		this.disposables.push(groundPlane);

		const platform: Mesh =
			MeshBuilder.CreateCylinder(
				"rescue-platform",
				{
					diameter: RESCUE_PLATFORM_RADIUS * 2,
					height: RESCUE_PLATFORM_HEIGHT,
					tessellation: 48
				},
				scene);

		const platformMaterial: StandardMaterial =
			new StandardMaterial("rescue-platform-mat", scene);

		platformMaterial.diffuseColor =
			ROAD_COLOR.clone();
		platformMaterial.specularColor =
			new Color3(0.05, 0.05, 0.05);

		platform.position =
			new Vector3(
				position.x,
				RESCUE_PLATFORM_HEIGHT / 2,
				position.z);
		platform.material = platformMaterial;
		this.disposables.push(platform);

		const ring: Mesh =
			MeshBuilder.CreateTorus(
				"rescue-ring",
				{
					diameter: RESCUE_PLATFORM_RADIUS * 2,
					thickness: 0.6,
					tessellation: 48
				},
				scene);

		const ringMaterial: StandardMaterial =
			new StandardMaterial("rescue-ring-mat", scene);

		ringMaterial.diffuseColor =
			RESCUE_RING_COLOR.clone();
		ringMaterial.emissiveColor =
			new Color3(0.3, 0.25, 0.1);

		ring.position =
			new Vector3(
				position.x,
				RESCUE_PLATFORM_HEIGHT + 0.05,
				position.z);
		ring.material = ringMaterial;
		this.disposables.push(ring);
	}

	/**
	 * Set up exponential fog for subtle depth perception.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private setupFog(scene: Scene): void
	{
		scene.fogMode =
			Scene.FOGMODE_EXP2;
		scene.fogDensity = FOG_DENSITY;
		scene.fogColor =
			new Color3(0.7, 0.8, 0.9);
	}

	/**
	 * Create puffy cartoon clouds from grouped spheres.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createClouds(scene: Scene): void
	{
		const cloudMaterial: StandardMaterial =
			new StandardMaterial("cloud-mat", scene);

		cloudMaterial.diffuseColor =
			new Color3(0.95, 0.95, 1.0);
		cloudMaterial.emissiveColor =
			new Color3(0.4, 0.4, 0.45);
		cloudMaterial.specularColor =
			new Color3(0.05, 0.05, 0.05);
		cloudMaterial.freeze();

		for (let cloudIndex: number = 0; cloudIndex < CLOUD_COUNT; cloudIndex++)
		{
			const baseX: number =
				(cloudIndex - CLOUD_COUNT / 2) * 60 + Math.random() * 30;
			const baseY: number =
				CLOUD_MIN_Y + Math.random() * (CLOUD_MAX_Y - CLOUD_MIN_Y);
			const baseZ: number =
				Math.random() * 200 - 50;
			const puffCount: number =
				3 + Math.floor(Math.random() * 3);

			for (let puffIndex: number = 0; puffIndex < puffCount; puffIndex++)
			{
				const diameter: number =
					4 + Math.random() * 4;
				const puff: Mesh =
					MeshBuilder.CreateSphere(
						`cloud-${cloudIndex}-puff-${puffIndex}`,
						{
							diameter,
							segments: 6
						},
						scene);

				puff.position =
					new Vector3(
						baseX + (puffIndex - puffCount / 2) * 3,
						baseY + Math.random() * 2,
						baseZ + Math.random() * 3);
				puff.material = cloudMaterial;
				puff.freezeWorldMatrix();
				this.disposables.push(puff);
			}
		}
	}

	/**
	 * Create a castle backdrop behind the rescue platform.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param position
	 * Center position of the rescue platform.
	 */
	createCastle(
		scene: Scene,
		position: Vector3): void
	{
		const castleZ: number =
			position.z + CASTLE_OFFSET_Z;

		const wallMat: StandardMaterial =
			new StandardMaterial("castle-wall-mat", scene);
		wallMat.diffuseColor =
			CASTLE_WALL_COLOR.clone();
		this.disposables.push(wallMat);

		const towerMat: StandardMaterial =
			new StandardMaterial("castle-tower-mat", scene);
		towerMat.diffuseColor =
			CASTLE_TOWER_COLOR.clone();
		this.disposables.push(towerMat);

		const flagMat: StandardMaterial =
			new StandardMaterial("castle-flag-mat", scene);
		flagMat.diffuseColor =
			CASTLE_FLAG_COLOR.clone();
		flagMat.emissiveColor =
			CASTLE_FLAG_COLOR.scale(0.2);
		this.disposables.push(flagMat);

		const wall: Mesh =
			MeshBuilder.CreateBox(
				"castle-wall",
				{
					width: CASTLE_WALL_WIDTH,
					height: CASTLE_WALL_HEIGHT,
					depth: 8
				},
				scene);
		wall.position =
			new Vector3(position.x, CASTLE_WALL_HEIGHT / 2, castleZ);
		wall.material = wallMat;
		this.disposables.push(wall);

		const towerOffsets: number[][] =
			[
				[-CASTLE_WALL_WIDTH / 2, -4],
				[CASTLE_WALL_WIDTH / 2, -4],
				[-CASTLE_WALL_WIDTH / 2, 4],
				[CASTLE_WALL_WIDTH / 2, 4]
			];

		for (let towerIndex: number = 0; towerIndex < towerOffsets.length; towerIndex++)
		{
			const offsetX: number =
				towerOffsets[towerIndex][0];
			const offsetZ: number =
				towerOffsets[towerIndex][1];

			const tower: Mesh =
				MeshBuilder.CreateCylinder(
					`castle-tower-${towerIndex}`,
					{
						diameter: 8,
						height: CASTLE_TOWER_HEIGHT,
						tessellation: 16
					},
					scene);
			tower.position =
				new Vector3(
					position.x + offsetX,
					CASTLE_TOWER_HEIGHT / 2,
					castleZ + offsetZ);
			tower.material = towerMat;
			this.disposables.push(tower);

			const cone: Mesh =
				MeshBuilder.CreateCylinder(
					`castle-cone-${towerIndex}`,
					{
						diameterTop: 0,
						diameterBottom: 10,
						height: 8,
						tessellation: 16
					},
					scene);
			cone.position =
				new Vector3(
					position.x + offsetX,
					CASTLE_TOWER_HEIGHT + 4,
					castleZ + offsetZ);
			cone.material = towerMat;
			this.disposables.push(cone);
		}

		for (let flagIdx: number = 0; flagIdx < 2; flagIdx++)
		{
			const flagX: number =
				position.x + towerOffsets[flagIdx][0];
			const flag: Mesh =
				MeshBuilder.CreateBox(
					`castle-flag-${flagIdx}`,
					{
						width: 3,
						height: 2,
						depth: 0.1
					},
					scene);
			flag.position =
				new Vector3(
					flagX,
					CASTLE_TOWER_HEIGHT + 9,
					castleZ + towerOffsets[flagIdx][1]);
			flag.material = flagMat;
			this.disposables.push(flag);
		}

		const gateMat: StandardMaterial =
			new StandardMaterial("castle-gate-mat", scene);
		gateMat.diffuseColor =
			new Color3(0.15, 0.1, 0.08);
		this.disposables.push(gateMat);

		const gate: Mesh =
			MeshBuilder.CreateBox(
				"castle-gate",
				{
					width: 8,
					height: 12,
					depth: 9
				},
				scene);
		gate.position =
			new Vector3(position.x, 6, castleZ);
		gate.material = gateMat;
		this.disposables.push(gate);

		const battlementCount: number = 10;
		for (let batIdx: number = 0; batIdx < battlementCount; batIdx++)
		{
			const batX: number =
				position.x
					- CASTLE_WALL_WIDTH / 2
					+ (batIdx + 0.5) * (CASTLE_WALL_WIDTH / battlementCount);
			const battlement: Mesh =
				MeshBuilder.CreateBox(
					`castle-battlement-${batIdx}`,
					{
						width: 2,
						height: 3,
						depth: 2
					},
					scene);
			battlement.position =
				new Vector3(batX, CASTLE_WALL_HEIGHT + 1.5, castleZ - 3);
			battlement.material = wallMat;
			this.disposables.push(battlement);
		}
	}

	/**
	 * Create a widening approach road from the last track segment to the octopus.
	 * The road flares from ROAD_WIDTH to APPROACH_ROAD_END_WIDTH.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param octopusPosition
	 * Center position of the octopus body.
	 */
	createApproachRoad(
		scene: Scene,
		octopusPosition: Vector3): void
	{
		const roadMat: StandardMaterial =
			new StandardMaterial("approach-road-mat", scene);
		roadMat.diffuseColor =
			ROAD_COLOR.clone();
		roadMat.specularColor =
			new Color3(0.05, 0.05, 0.05);
		roadMat.freeze();

		const approachLength: number =
			OCTOPUS_SPAWN_OFFSET_Z;
		const stepLength: number =
			approachLength / APPROACH_ROAD_STEPS;
		const startZ: number =
			octopusPosition.z - approachLength;

		for (let step: number = 0; step < APPROACH_ROAD_STEPS; step++)
		{
			const progress: number =
				(step + 0.5) / APPROACH_ROAD_STEPS;
			const segWidth: number =
				ROAD_WIDTH + (APPROACH_ROAD_END_WIDTH - ROAD_WIDTH) * progress;

			const seg: Mesh =
				MeshBuilder.CreateBox(
					`approach-road-${step}`,
					{
						width: segWidth,
						height: 0.1,
						depth: stepLength + 1
					},
					scene);

			seg.position =
				new Vector3(
					octopusPosition.x,
					0.04,
					startZ + step * stepLength + stepLength / 2);
			seg.material = roadMat;
			this.disposables.push(seg);
		}
	}

	/**
	 * Create the landing road between octopus and rescue platform.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param octopusPosition
	 * Center position of the octopus body.
	 */
	createLandingRoad(
		scene: Scene,
		octopusPosition: Vector3): void
	{
		const roadMat: StandardMaterial =
			new StandardMaterial("landing-road-mat", scene);
		roadMat.diffuseColor =
			ROAD_COLOR.clone();
		roadMat.specularColor =
			new Color3(0.05, 0.05, 0.05);
		roadMat.freeze();

		const roadCenterZ: number =
			octopusPosition.z + LANDING_ROAD_LENGTH / 2;

		const road: Mesh =
			MeshBuilder.CreateBox(
				"landing-road",
				{
					width: LANDING_ROAD_WIDTH,
					height: 0.1,
					depth: LANDING_ROAD_LENGTH
				},
				scene);
		road.position =
			new Vector3(
				octopusPosition.x,
				0.05,
				roadCenterZ);
		road.material = roadMat;
		this.disposables.push(road);
	}
}