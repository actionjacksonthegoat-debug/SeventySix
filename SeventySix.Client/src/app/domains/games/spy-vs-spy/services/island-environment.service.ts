// <copyright file="island-environment.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Injectable } from "@angular/core";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

/* Side-effect imports required by Vite tree-shaking. */
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";

import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	AIRSTRIP_RUNWAY_LENGTH,
	AIRSTRIP_RUNWAY_WIDTH,
	BEACH_SAND_COLOR,
	ISLAND_BASE_RADIUS,
	ISLAND_GROUND_Y,
	ISLAND_PERIMETER_POINTS,
	ISLAND_ROOMS,
	ISLAND_SHAPE_VARIATION,
	ROOM_WALL_HEIGHT,
	WATER_PLANE_SIZE
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";

/** Water color. */
const WATER_COLOR: string = "#1A6B8A";

/** Water emissive tint. */
const WATER_EMISSIVE_COLOR: string = "#0A3040";

/** Water surface Y offset below ground. */
const WATER_Y_OFFSET: number = -0.3;

/** Airstrip runway surface color (dark gray). */
const AIRSTRIP_SURFACE_COLOR: string = "#505050";

/** Runway dash center stripe color (white). */
const RUNWAY_DASH_COLOR: string = "#FFFFFF";

/**
 * Manages environment construction for the Spy vs Spy island scene.
 *
 * @description
 * Handles skybox, lighting, room lights, island ground, water with wave
 * animation, and airstrip creation. Route-scoped — do not add `providedIn`.
 */
@Injectable()
export class IslandEnvironmentService
{
	/** References to disposable scene objects. */
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/**
	 * Initializes all environment elements in the scene.
	 *
	 * @param scene
	 *   The Babylon.js scene to populate with environment objects.
	 */
	public initialize(scene: Scene): void
	{
		this.createSkybox(scene);
		this.createLighting(scene);
		this.createIslandGround(scene);
		this.createWater(scene);
		this.createAirstrip(scene);
	}

	/**
	 * Disposes all environment objects and clears internal references.
	 */
	public dispose(): void
	{
		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
	}

	/**
	 * Creates the tropical skybox surrounding the island.
	 *
	 * @param scene
	 *   The Babylon.js scene to add the skybox to.
	 */
	private createSkybox(scene: Scene): void
	{
		const skybox: Mesh =
			MeshBuilder.CreateBox(
				"skybox",
				{ size: 500 },
				scene);

		const skyMaterial: StandardMaterial =
			new StandardMaterial(
				"skybox-material",
				scene);

		skyMaterial.backFaceCulling = false;

		skyMaterial.reflectionTexture =
			new CubeTexture(
				"assets/babylonjs/skyboxes/TropicalSunnyDay/TropicalSunnyDay",
				scene);

		skyMaterial.reflectionTexture.coordinatesMode =
			Texture.SKYBOX_MODE;

		skyMaterial.diffuseColor =
			Color3.Black();
		skyMaterial.specularColor =
			Color3.Black();

		skybox.material = skyMaterial;
		skybox.infiniteDistance = true;

		this.disposables.push(skybox);
		this.disposables.push(skyMaterial);
	}

	/**
	 * Creates ambient and directional lighting for the scene.
	 *
	 * @param scene
	 *   The Babylon.js scene to add lights to.
	 */
	private createLighting(scene: Scene): void
	{
		const hemisphericLight: HemisphericLight =
			new HemisphericLight(
				"ambient-light",
				new Vector3(0, 1, 0),
				scene);

		hemisphericLight.intensity = 0.7;
		hemisphericLight.diffuse =
			new Color3(1.0, 0.95, 0.85);
		hemisphericLight.groundColor =
			new Color3(0.4, 0.5, 0.35);

		const directionalLight: DirectionalLight =
			new DirectionalLight(
				"sun-light",
				new Vector3(-0.5, -1, 0.5)
					.normalize(),
				scene);

		directionalLight.intensity = 0.9;
		directionalLight.diffuse =
			new Color3(1.0, 0.93, 0.8);
		directionalLight.specular =
			new Color3(0.6, 0.55, 0.5);

		this.disposables.push(hemisphericLight);
		this.disposables.push(directionalLight);

		this.createRoomLights(scene);
	}

	/**
	 * Creates point lights inside each island room.
	 *
	 * @param scene
	 *   The Babylon.js scene to add room lights to.
	 */
	private createRoomLights(scene: Scene): void
	{
		for (const room of ISLAND_ROOMS)
		{
			const pointLight: PointLight =
				new PointLight(
					`room-light-${room.id}`,
					new Vector3(
						room.centerX,
						ISLAND_GROUND_Y + ROOM_WALL_HEIGHT - 0.5,
						room.centerZ),
					scene);

			pointLight.intensity = 1.2;
			pointLight.diffuse =
				new Color3(1.0, 0.95, 0.85);
			pointLight.range =
				Math.max(
					room.halfWidth,
					room.halfDepth) * 3.0;

			this.disposables.push(pointLight);
		}
	}

	/**
	 * Creates the island ground mesh with a natural shoreline shape.
	 *
	 * @param scene
	 *   The Babylon.js scene to add the island ground to.
	 */
	private createIslandGround(scene: Scene): void
	{
		/* Build a natural island shape using fan-triangulated polygon vertices. */
		const numPoints: number =
			ISLAND_PERIMETER_POINTS;
		const positions: number[] =
			[0, 0, 0];
		const normals: number[] =
			[0, 1, 0];
		const indices: number[] = [];

		for (let idx: number = 0; idx < numPoints; idx++)
		{
			const angle: number =
				(idx / numPoints) * Math.PI * 2;
			const perturbation: number =
				ISLAND_SHAPE_VARIATION * Math.cos(angle * 3)
					+ ISLAND_SHAPE_VARIATION * 0.5 * Math.sin(angle * 5);
			const radius: number =
				ISLAND_BASE_RADIUS + perturbation;

			positions.push(
				Math.cos(angle) * radius,
				0,
				Math.sin(angle) * radius);
			normals.push(0, 1, 0);
		}

		/* Fan triangulation from center vertex (index 0) to perimeter ring. */
		for (let idx: number = 1; idx <= numPoints; idx++)
		{
			const nextIdx: number =
				idx === numPoints ? 1 : idx + 1;
			indices.push(0, idx, nextIdx);
		}

		const vertexData: VertexData =
			new VertexData();
		vertexData.positions = positions;
		vertexData.indices = indices;
		vertexData.normals = normals;

		const ground: Mesh =
			new Mesh("island-ground", scene);
		vertexData.applyToMesh(ground);

		const material: StandardMaterial =
			new StandardMaterial(
				"island-ground-material",
				scene);

		material.diffuseColor =
			Color3.FromHexString(BEACH_SAND_COLOR);
		material.specularColor =
			new Color3(0.1, 0.1, 0.1);

		ground.material = material;
		ground.position.y = ISLAND_GROUND_Y;

		this.disposables.push(ground);
	}

	/**
	 * Creates the ocean water plane with animated wave displacement.
	 *
	 * @param scene
	 *   The Babylon.js scene to add the water to.
	 */
	private createWater(scene: Scene): void
	{
		const water: Mesh =
			MeshBuilder.CreateGround(
				"water-plane",
				{
					width: WATER_PLANE_SIZE,
					height: WATER_PLANE_SIZE,
					subdivisions: 64
				},
				scene);

		const material: StandardMaterial =
			new StandardMaterial(
				"water-material",
				scene);

		material.diffuseColor =
			Color3.FromHexString(WATER_COLOR);
		material.specularColor =
			new Color3(0.6, 0.6, 0.7);
		material.specularPower = 128;
		material.emissiveColor =
			Color3.FromHexString(WATER_EMISSIVE_COLOR);
		material.alpha = 0.9;
		material.backFaceCulling = false;

		water.material = material;
		water.position.y = WATER_Y_OFFSET;

		/* Animate subtle wave displacement on the water surface. */
		this.setupWaveAnimation(scene, water);

		this.disposables.push(water);
		this.disposables.push(material);
	}

	/**
	 * Registers a per-frame wave displacement observer on the water mesh.
	 *
	 * @param scene
	 *   The Babylon.js scene to register the render observer on.
	 * @param water
	 *   The water mesh whose vertices are displaced each frame.
	 */
	private setupWaveAnimation(scene: Scene, water: Mesh): void
	{
		let waveTime: number = 0;
		const positions: Float32Array | null =
			water.getVerticesData("position") as Float32Array | null;

		if (positions !== null)
		{
			const originalY: Float32Array =
				new Float32Array(positions.length / 3);

			for (let idx: number = 0; idx < originalY.length; idx++)
			{
				originalY[idx] =
					positions[idx * 3 + 1];
			}

			const waveObserver: ReturnType<typeof scene.onBeforeRenderObservable.add> =
				scene
					.onBeforeRenderObservable
					.add(
						() =>
						{
							waveTime += 0.02;
							const vertexCount: number =
								originalY.length;

							for (let idx: number = 0; idx < vertexCount; idx++)
							{
								const posX: number =
									positions[idx * 3];
								const posZ: number =
									positions[idx * 3 + 2];

								positions[idx * 3 + 1] =
									originalY[idx]
										+ Math.sin(posX * 0.15 + waveTime) * 0.3
										+ Math.cos(posZ * 0.12 + waveTime * 0.8) * 0.2;
							}

							water.updateVerticesData("position", positions);
						});

			this.disposables.push(
				{ dispose: () =>
					scene.onBeforeRenderObservable.remove(waveObserver) });
		}
	}

	/**
	 * Creates the airstrip runway with dashed center line markings.
	 *
	 * @param scene
	 *   The Babylon.js scene to add the airstrip to.
	 */
	private createAirstrip(scene: Scene): void
	{
		/* Runway surface (dark gray ground plane) — oriented along X axis (east-west). */
		const runway: Mesh =
			MeshBuilder.CreateGround(
				"airstrip-runway",
				{
					width: AIRSTRIP_RUNWAY_LENGTH,
					height: AIRSTRIP_RUNWAY_WIDTH
				},
				scene);

		const runwayMaterial: StandardMaterial =
			new StandardMaterial("airstrip-runway-material", scene);

		runwayMaterial.diffuseColor =
			Color3.FromHexString(AIRSTRIP_SURFACE_COLOR);
		runwayMaterial.specularColor =
			new Color3(0.1, 0.1, 0.1);

		runway.material = runwayMaterial;
		runway.position.x = AIRSTRIP_CENTER_X;
		runway.position.y =
			ISLAND_GROUND_Y + 0.02;
		runway.position.z = AIRSTRIP_CENTER_Z;
		this.disposables.push(runway);

		/* Center dashed line markings along X axis (east-west). */
		const dashCount: number = 12;
		const dashLength: number = 2;
		const dashGap: number =
			(AIRSTRIP_RUNWAY_LENGTH - dashCount * dashLength) / (dashCount + 1);

		for (let idx: number = 0; idx < dashCount; idx++)
		{
			const dash: Mesh =
				MeshBuilder.CreateBox(
					`runway-dash-${idx}`,
					{
						width: dashLength,
						height: 0.01,
						depth: 0.4
					},
					scene);

			const dashMaterial: StandardMaterial =
				new StandardMaterial(`runway-dash-material-${idx}`, scene);

			dashMaterial.diffuseColor =
				Color3.FromHexString(RUNWAY_DASH_COLOR);
			dashMaterial.emissiveColor =
				new Color3(0.3, 0.3, 0.3);

			dash.material = dashMaterial;
			dash.position.x =
				AIRSTRIP_CENTER_X
					- AIRSTRIP_RUNWAY_LENGTH / 2
					+ dashGap
					+ dashLength / 2
					+ idx * (dashLength + dashGap);
			dash.position.y =
				ISLAND_GROUND_Y + 0.04;
			dash.position.z = AIRSTRIP_CENTER_Z;
			this.disposables.push(dash);
		}
	}
}