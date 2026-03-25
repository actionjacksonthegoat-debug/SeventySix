// <copyright file="island-scene.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Island Scene Service — Orchestrator.
 * Delegates environment, decoration, and outdoor creation to focused sub-services.
 * Retains room geometry (floors, walls, doorways) as its own cohesive responsibility.
 */

import { inject, Injectable } from "@angular/core";
import type { ICanvasRenderingContext } from "@babylonjs/core/Engines/ICanvas";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	DOORWAY_WIDTH,
	ISLAND_GROUND_Y,
	ISLAND_ROOMS,
	ROOM_WALL_HEIGHT
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { IslandDecorationService } from "@games/spy-vs-spy/services/island-decoration.service";
import { IslandEnvironmentService } from "@games/spy-vs-spy/services/island-environment.service";
import { IslandOutdoorService } from "@games/spy-vs-spy/services/island-outdoor.service";

/** Parameters for creating a wall or doorway segment. */
interface CreateWallOrDoorwayParams
{
	/** The Babylon.js Scene. */
	readonly scene: Scene;
	/** Base mesh name for the wall segments. */
	readonly baseName: string;
	/** The wall material. */
	readonly material: StandardMaterial;
	/** Wall center position (X, Y, Z). */
	readonly center: Vector3;
	/** Wall dimensions (width, height, depth). */
	readonly dimensions: Vector3;
	/** Whether to create a doorway gap. */
	readonly hasDoorway: boolean;
	/** Whether the wall runs along the X axis (true) or Z axis (false). */
	readonly isHorizontal: boolean;
}

/** Parameters for creating a single wall box. */
interface CreateWallParams
{
	/** The Babylon.js Scene. */
	readonly scene: Scene;
	/** Mesh name. */
	readonly name: string;
	/** The wall material. */
	readonly material: StandardMaterial;
	/** Wall center position (X, Y, Z). */
	readonly position: Vector3;
	/** Wall dimensions (width, height, depth). */
	readonly dimensions: Vector3;
}

/** Configuration for a single cardinal wall. */
interface WallConfiguration
{
	/** Cardinal direction name. */
	readonly direction: string;
	/** Wall center position (X, Y, Z). */
	readonly center: Vector3;
	/** Wall dimensions (width, height, depth). */
	readonly dimensions: Vector3;
	/** Whether a connected room exists in this direction. */
	readonly hasDoorway: boolean;
	/** Whether the wall runs along the X axis (true) or Z axis (false). */
	readonly isHorizontal: boolean;
}

/** Parameters for creating doorframe posts around a doorway. */
interface DoorframePostsParams
{
	/** The Babylon.js Scene. */
	readonly scene: Scene;
	/** Base mesh name for the posts. */
	readonly baseName: string;
	/** Doorway center position. */
	readonly center: Vector3;
	/** Wall height for the posts. */
	readonly wallHeight: number;
	/** Wall thickness for the posts. */
	readonly wallThickness: number;
	/** Whether the wall runs along the X axis. */
	readonly isHorizontal: boolean;
}

/** Room theme color mapping — bold, distinct colors matching 1984 aesthetic. */
const ROOM_COLORS: ReadonlyMap<RoomId, string> =
	new Map<RoomId, string>(
		[
			[RoomId.BeachShack, "#E8C872"],
			[RoomId.JungleHQ, "#2E8B2E"],
			[RoomId.Watchtower, "#A0A0A0"],
			[RoomId.CoveCave, "#7B5236"],
			[RoomId.Compound, "#C0C0C0"],
			[RoomId.Library, "#787878"]
		]);

/** Darker accent color for checkerboard pattern per room. */
const ROOM_ACCENT_COLORS: ReadonlyMap<RoomId, string> =
	new Map<RoomId, string>(
		[
			[RoomId.BeachShack, "#D0B060"],
			[RoomId.JungleHQ, "#227022"],
			[RoomId.Watchtower, "#888888"],
			[RoomId.CoveCave, "#5A3A1E"],
			[RoomId.Compound, "#A8A8A8"],
			[RoomId.Library, "#606060"]
		]);

/** Island ground color (sandy tan). */
const ISLAND_GROUND_COLOR: string = "#C2A267";

/** Wall thickness in world units. */
const WALL_THICKNESS: number = 0.5;

/** Library runway stripe color (white). */
const RUNWAY_STRIPE_COLOR: string = "#FFFFFF";

/** Runway stripe width. */
const RUNWAY_STRIPE_WIDTH: number = 1;

/** Runway stripe Y offset above Library floor. */
const RUNWAY_STRIPE_Y: number = 0.02;

/** Checkerboard texture resolution in pixels. */
const CHECKERBOARD_TILE_COUNT: number = 8;

/** Checkerboard texture size in pixels. */
const CHECKERBOARD_TEXTURE_SIZE: number = 256;

/**
 * Orchestrates the island scene — delegates environment, decoration, and outdoor
 * creation to focused sub-services while retaining room geometry as its own concern.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class IslandSceneService
{
	/** Environment sub-service for skybox, lighting, ground, water, airstrip. */
	private readonly environmentService: IslandEnvironmentService =
		inject(IslandEnvironmentService);

	/** Decoration sub-service for ceilings, labels, door outlines, wall art. */
	private readonly decorationService: IslandDecorationService =
		inject(IslandDecorationService);

	/** Outdoor sub-service for trees, rocks, perimeter vegetation. */
	private readonly outdoorService: IslandOutdoorService =
		inject(IslandOutdoorService);

	/** References to disposable scene objects. */
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/** Floor meshes per room for room detection. */
	private readonly roomFloorMeshes: Map<RoomId, Mesh> =
		new Map<RoomId, Mesh>();

	/**
	 * Create all scene geometry for the island.
	 * @param scene
	 * The Babylon.js Scene to populate.
	 */
	initialize(scene: Scene): void
	{
		this.environmentService.initialize(scene);
		this.createRooms(scene);
		this.decorationService.initialize(scene);
		this.outdoorService.initialize(scene);
	}

	/**
	 * Dispose all created meshes, materials, and lights.
	 */
	dispose(): void
	{
		this.outdoorService.dispose();
		this.decorationService.dispose();

		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
		this.roomFloorMeshes.clear();

		this.environmentService.dispose();
	}

	/**
	 * Return the floor mesh for a specific room (used for room detection).
	 * @param roomId
	 * The room identifier.
	 * @returns The floor mesh, or null if not yet initialized.
	 */
	getRoomFloorMesh(roomId: RoomId): Nullable<Mesh>
	{
		return this.roomFloorMeshes.get(roomId) ?? null;
	}

	/**
	 * Create room floor tiles and boundary walls for each room.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createRooms(scene: Scene): void
	{
		for (const room of ISLAND_ROOMS)
		{
			this.createRoomFloor(scene, room);
			this.createRoomWalls(scene, room);
		}
	}

	/**
	 * Create a room floor tile with checkerboard pattern texture.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 */
	private createRoomFloor(
		scene: Scene,
		room: RoomDefinition): void
	{
		const floor: Mesh =
			MeshBuilder.CreateBox(
				`room-floor-${room.id}`,
				{
					width: room.halfWidth * 2,
					height: 0.1,
					depth: room.halfDepth * 2
				},
				scene);

		const colorHex: string =
			ROOM_COLORS.get(room.id) ?? ISLAND_GROUND_COLOR;
		const accentHex: string =
			ROOM_ACCENT_COLORS.get(room.id) ?? colorHex;

		const material: StandardMaterial =
			new StandardMaterial(
				`room-floor-material-${room.id}`,
				scene);

		material.diffuseTexture =
			this.createCheckerboardTexture(
				scene,
				`floor-tex-${room.id}`,
				colorHex,
				accentHex);
		material.specularColor =
			new Color3(0.15, 0.12, 0.1);
		material.emissiveColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.15);

		floor.material = material;
		floor.position.x =
			room.centerX;
		floor.position.y =
			ISLAND_GROUND_Y + 0.05;
		floor.position.z =
			room.centerZ;

		this.roomFloorMeshes.set(room.id, floor);
		this.disposables.push(floor);

		if (room.id === RoomId.Library)
		{
			this.createRunwayStripe(scene, room);
		}
	}

	/**
	 * Create a white runway stripe on the Library floor.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The Library room definition.
	 */
	private createRunwayStripe(
		scene: Scene,
		room: RoomDefinition): void
	{
		const stripe: Mesh =
			MeshBuilder.CreateBox(
				"runway-stripe",
				{
					width: RUNWAY_STRIPE_WIDTH,
					height: 0.02,
					depth: room.halfDepth * 2 - 2
				},
				scene);

		const material: StandardMaterial =
			new StandardMaterial(
				"runway-stripe-material",
				scene);

		material.diffuseColor =
			Color3.FromHexString(RUNWAY_STRIPE_COLOR);
		material.emissiveColor =
			new Color3(0.5, 0.5, 0.5);

		stripe.material = material;
		stripe.position.x =
			room.centerX;
		stripe.position.y =
			ISLAND_GROUND_Y + 0.05 + RUNWAY_STRIPE_Y;
		stripe.position.z =
			room.centerZ;

		this.disposables.push(stripe);
	}

	/**
	 * Create boundary walls around a room with doorway gaps for connected rooms.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 */
	private createRoomWalls(
		scene: Scene,
		room: RoomDefinition): void
	{
		const colorHex: string =
			ROOM_COLORS.get(room.id) ?? ISLAND_GROUND_COLOR;

		const wallMaterial: StandardMaterial =
			new StandardMaterial(
				`room-wall-material-${room.id}`,
				scene);

		wallMaterial.diffuseColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.7);
		wallMaterial.specularColor =
			new Color3(0.05, 0.05, 0.05);

		const connectedRooms: RoomDefinition[] =
			room
				.connections
				.map((connId) =>
					ISLAND_ROOMS.find((room) => room.id === connId))
				.filter((room): room is RoomDefinition =>
					room !== undefined);

		const configs: WallConfiguration[] =
			this.buildWallConfigurations(room, connectedRooms);

		for (const config of configs)
		{
			this.createWallOrDoorway(
				{
					scene,
					baseName: `wall-${config.direction}-${room.id}`,
					material: wallMaterial,
					center: config.center,
					dimensions: config.dimensions,
					hasDoorway: config.hasDoorway,
					isHorizontal: config.isHorizontal
				});
		}

		this.createWallTrim(scene, room, colorHex);
		this.createFloorLip(scene, room, colorHex);
		this.createBaseboards(scene, room, colorHex);

		this.disposables.push(wallMaterial);
	}

	/**
	 * Creates decorative trim strips at the top of room walls.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 * @param colorHex
	 * Room color hex string for material tinting.
	 */
	private createWallTrim(
		scene: Scene,
		room: RoomDefinition,
		colorHex: string): void
	{
		const trimMaterial: StandardMaterial =
			new StandardMaterial(
				`room-wall-trim-${room.id}`,
				scene);

		trimMaterial.diffuseColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.9);
		trimMaterial.emissiveColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.15);

		this.disposables.push(trimMaterial);

		const trimHeight: number = 0.15;
		const trimY: number =
			ISLAND_GROUND_Y + ROOM_WALL_HEIGHT + trimHeight / 2;
		const fullWidth: number =
			room.halfWidth * 2 + WALL_THICKNESS;
		const fullDepth: number =
			room.halfDepth * 2 + WALL_THICKNESS;

		const trimNorth: Mesh =
			MeshBuilder.CreateBox(
				`wall-trim-north-${room.id}`,
				{ width: fullWidth, height: trimHeight, depth: WALL_THICKNESS },
				scene);
		trimNorth.material = trimMaterial;
		trimNorth.position.set(
			room.centerX,
			trimY,
			room.centerZ - room.halfDepth);
		this.disposables.push(trimNorth);

		const trimSouth: Mesh =
			MeshBuilder.CreateBox(
				`wall-trim-south-${room.id}`,
				{ width: fullWidth, height: trimHeight, depth: WALL_THICKNESS },
				scene);
		trimSouth.material = trimMaterial;
		trimSouth.position.set(
			room.centerX,
			trimY,
			room.centerZ + room.halfDepth);
		this.disposables.push(trimSouth);

		const trimWest: Mesh =
			MeshBuilder.CreateBox(
				`wall-trim-west-${room.id}`,
				{ width: WALL_THICKNESS, height: trimHeight, depth: fullDepth },
				scene);
		trimWest.material = trimMaterial;
		trimWest.position.set(
			room.centerX - room.halfWidth,
			trimY,
			room.centerZ);
		this.disposables.push(trimWest);

		const trimEast: Mesh =
			MeshBuilder.CreateBox(
				`wall-trim-east-${room.id}`,
				{ width: WALL_THICKNESS, height: trimHeight, depth: fullDepth },
				scene);
		trimEast.material = trimMaterial;
		trimEast.position.set(
			room.centerX + room.halfWidth,
			trimY,
			room.centerZ);
		this.disposables.push(trimEast);
	}

	/**
	 * Creates a floor lip strip at the south wall edge of a room.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 * @param colorHex
	 * Room color hex string for material tinting.
	 */
	private createFloorLip(
		scene: Scene,
		room: RoomDefinition,
		colorHex: string): void
	{
		const fullWidth: number =
			room.halfWidth * 2 + WALL_THICKNESS;
		const lipHeight: number = 0.2;
		const lipMaterial: StandardMaterial =
			new StandardMaterial(
				`room-floor-lip-${room.id}`,
				scene);

		lipMaterial.diffuseColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.5);
		lipMaterial.specularColor =
			new Color3(0.05, 0.05, 0.05);

		this.disposables.push(lipMaterial);

		const lip: Mesh =
			MeshBuilder.CreateBox(
				`floor-lip-south-${room.id}`,
				{
					width: fullWidth,
					height: lipHeight,
					depth: WALL_THICKNESS * 0.5
				},
				scene);

		lip.material = lipMaterial;
		lip.position.set(
			room.centerX,
			ISLAND_GROUND_Y + lipHeight / 2,
			room.centerZ + room.halfDepth);
		this.disposables.push(lip);
	}

	/**
	 * Creates interior wall baseboards at floor level on north, east, and west walls.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param room
	 * The room definition.
	 * @param colorHex
	 * Room color hex string for material tinting.
	 */
	private createBaseboards(
		scene: Scene,
		room: RoomDefinition,
		colorHex: string): void
	{
		const fullWidth: number =
			room.halfWidth * 2 + WALL_THICKNESS;
		const fullDepth: number =
			room.halfDepth * 2 + WALL_THICKNESS;
		const baseboardHeight: number = 0.25;
		const baseboardY: number =
			ISLAND_GROUND_Y + baseboardHeight / 2;

		const baseboardMaterial: StandardMaterial =
			new StandardMaterial(
				`room-baseboard-${room.id}`,
				scene);

		baseboardMaterial.diffuseColor =
			Color3
				.FromHexString(colorHex)
				.scale(0.4);
		baseboardMaterial.specularColor =
			new Color3(0.05, 0.05, 0.05);

		this.disposables.push(baseboardMaterial);

		const baseboardNorth: Mesh =
			MeshBuilder.CreateBox(
				`baseboard-north-${room.id}`,
				{ width: fullWidth, height: baseboardHeight, depth: 0.12 },
				scene);

		baseboardNorth.material = baseboardMaterial;
		baseboardNorth.position.set(
			room.centerX,
			baseboardY,
			room.centerZ - room.halfDepth + WALL_THICKNESS / 2 + 0.06);
		this.disposables.push(baseboardNorth);

		const baseboardWest: Mesh =
			MeshBuilder.CreateBox(
				`baseboard-west-${room.id}`,
				{ width: 0.12, height: baseboardHeight, depth: fullDepth },
				scene);

		baseboardWest.material = baseboardMaterial;
		baseboardWest.position.set(
			room.centerX - room.halfWidth + WALL_THICKNESS / 2 + 0.06,
			baseboardY,
			room.centerZ);
		this.disposables.push(baseboardWest);

		const baseboardEast: Mesh =
			MeshBuilder.CreateBox(
				`baseboard-east-${room.id}`,
				{ width: 0.12, height: baseboardHeight, depth: fullDepth },
				scene);

		baseboardEast.material = baseboardMaterial;
		baseboardEast.position.set(
			room.centerX + room.halfWidth - WALL_THICKNESS / 2 - 0.06,
			baseboardY,
			room.centerZ);
		this.disposables.push(baseboardEast);
	}

	/**
	 * Build wall configurations for the four cardinal directions.
	 * @param room
	 * The room definition.
	 * @param connectedRooms
	 * The rooms connected to this room.
	 * @returns Array of wall configurations.
	 */
	private buildWallConfigurations(
		room: RoomDefinition,
		connectedRooms: ReadonlyArray<RoomDefinition>): WallConfiguration[]
	{
		const wallY: number =
			ISLAND_GROUND_Y + ROOM_WALL_HEIGHT / 2;
		const fullWidth: number =
			room.halfWidth * 2;
		const fullDepth: number =
			room.halfDepth * 2;

		/* Check if the airstrip zone is directly south of this room. */
		const southWallZ: number =
			room.centerZ + room.halfDepth;
		const airstripExitsSouth: boolean =
			Math.abs(room.centerX - AIRSTRIP_CENTER_X) <= room.halfWidth
				&& AIRSTRIP_CENTER_Z > southWallZ;

		/* All four cardinal walls with doorway gaps. */
		return [
			{
				direction: "north",
				center: new Vector3(room.centerX, wallY, room.centerZ - room.halfDepth),
				dimensions: new Vector3(fullWidth, ROOM_WALL_HEIGHT, WALL_THICKNESS),
				hasDoorway: connectedRooms.some((connectedRoom) =>
					connectedRoom.centerZ < room.centerZ),
				isHorizontal: true
			},
			{
				direction: "south",
				center: new Vector3(room.centerX, wallY, room.centerZ + room.halfDepth),
				dimensions: new Vector3(fullWidth, ROOM_WALL_HEIGHT, WALL_THICKNESS),
				hasDoorway: connectedRooms.some((connectedRoom) =>
					connectedRoom.centerZ > room.centerZ)
					|| airstripExitsSouth,
				isHorizontal: true
			},
			{
				direction: "west",
				center: new Vector3(room.centerX - room.halfWidth, wallY, room.centerZ),
				dimensions: new Vector3(WALL_THICKNESS, ROOM_WALL_HEIGHT, fullDepth),
				hasDoorway: connectedRooms.some((connectedRoom) =>
					connectedRoom.centerX < room.centerX),
				isHorizontal: false
			},
			{
				direction: "east",
				center: new Vector3(room.centerX + room.halfWidth, wallY, room.centerZ),
				dimensions: new Vector3(WALL_THICKNESS, ROOM_WALL_HEIGHT, fullDepth),
				hasDoorway: connectedRooms.some((connectedRoom) =>
					connectedRoom.centerX > room.centerX),
				isHorizontal: false
			}
		];
	}

	/**
	 * Create a full wall or two wall segments with a doorway gap.
	 * @param params
	 * Wall-or-doorway creation parameters.
	 */
	private createWallOrDoorway(params: CreateWallOrDoorwayParams): void
	{
		if (!params.hasDoorway)
		{
			this.createWall(
				{
					scene: params.scene,
					name: params.baseName,
					material: params.material,
					position: params.center,
					dimensions: params.dimensions
				});

			return;
		}

		if (params.isHorizontal)
		{
			this.createHorizontalDoorway(params);
		}
		else
		{
			this.createVerticalDoorway(params);
		}
	}

	/**
	 * Create two horizontal wall segments with a centered doorway gap.
	 * @param params
	 * Wall-or-doorway creation parameters.
	 */
	private createHorizontalDoorway(params: CreateWallOrDoorwayParams): void
	{
		const { scene, baseName, material, center, dimensions } = params;
		const wallSpan: number =
			dimensions.x;
		const segmentWidth: number =
			(wallSpan - DOORWAY_WIDTH) / 2;

		this.createWall(
			{
				scene,
				name: `${baseName}-left`,
				material,
				position: new Vector3(
					center.x - (DOORWAY_WIDTH / 2 + segmentWidth / 2),
					center.y,
					center.z),
				dimensions: new Vector3(
					segmentWidth,
					dimensions.y,
					dimensions.z)
			});

		this.createWall(
			{
				scene,
				name: `${baseName}-right`,
				material,
				position: new Vector3(
					center.x + (DOORWAY_WIDTH / 2 + segmentWidth / 2),
					center.y,
					center.z),
				dimensions: new Vector3(
					segmentWidth,
					dimensions.y,
					dimensions.z)
			});

		this.createDoorframePosts(
			{
				scene,
				baseName,
				center,
				wallHeight: dimensions.y,
				wallThickness: dimensions.z,
				isHorizontal: true
			});
	}

	/**
	 * Create two vertical wall segments with a centered doorway gap.
	 * @param params
	 * Wall-or-doorway creation parameters.
	 */
	private createVerticalDoorway(params: CreateWallOrDoorwayParams): void
	{
		const { scene, baseName, material, center, dimensions } = params;
		const wallSpan: number =
			dimensions.z;
		const segmentDepth: number =
			(wallSpan - DOORWAY_WIDTH) / 2;

		this.createWall(
			{
				scene,
				name: `${baseName}-top`,
				material,
				position: new Vector3(
					center.x,
					center.y,
					center.z - (DOORWAY_WIDTH / 2 + segmentDepth / 2)),
				dimensions: new Vector3(
					dimensions.x,
					dimensions.y,
					segmentDepth)
			});

		this.createWall(
			{
				scene,
				name: `${baseName}-bottom`,
				material,
				position: new Vector3(
					center.x,
					center.y,
					center.z + (DOORWAY_WIDTH / 2 + segmentDepth / 2)),
				dimensions: new Vector3(
					dimensions.x,
					dimensions.y,
					segmentDepth)
			});

		this.createDoorframePosts(
			{
				scene,
				baseName,
				center,
				wallHeight: dimensions.y,
				wallThickness: dimensions.x,
				isHorizontal: false
			});
	}

	/**
	 * Create a single wall box.
	 * @param params
	 * Wall creation parameters.
	 */
	private createWall(params: CreateWallParams): void
	{
		const wall: Mesh =
			MeshBuilder.CreateBox(
				params.name,
				{
					width: params.dimensions.x,
					height: params.dimensions.y,
					depth: params.dimensions.z
				},
				params.scene);

		wall.material =
			params.material;
		wall.position.x =
			params.position.x;
		wall.position.y =
			params.position.y;
		wall.position.z =
			params.position.z;

		this.disposables.push(wall);
	}

	/**
	 * Create doorframe accent posts on each side of a doorway opening.
	 * @param params
	 * Doorframe creation parameters.
	 */
	private createDoorframePosts(params: DoorframePostsParams): void
	{
		const { scene, baseName, center, wallHeight, wallThickness, isHorizontal } = params;
		const postWidth: number = 0.3;
		const postHeight: number =
			wallHeight + 0.3;

		const frameMaterial: StandardMaterial =
			new StandardMaterial(`doorframe-mat-${baseName}`, scene);

		frameMaterial.diffuseColor =
			new Color3(0.25, 0.18, 0.1);
		frameMaterial.specularColor =
			new Color3(0.1, 0.1, 0.1);

		this.disposables.push(frameMaterial);

		const halfDoorway: number =
			DOORWAY_WIDTH / 2;

		for (const side of [-1, 1])
		{
			const post: Mesh =
				MeshBuilder.CreateBox(
					`${baseName}-doorframe-${side > 0 ? "right" : "left"}`,
					{
						width: isHorizontal ? postWidth : wallThickness,
						height: postHeight,
						depth: isHorizontal ? wallThickness : postWidth
					},
					scene);

			post.material = frameMaterial;
			post.position.x =
				isHorizontal ? center.x + side * halfDoorway : center.x;
			post.position.y =
				ISLAND_GROUND_Y + postHeight / 2;
			post.position.z =
				isHorizontal ? center.z : center.z + side * halfDoorway;

			this.disposables.push(post);
		}

		/* Lintel bar across the top of the doorway. */
		const lintel: Mesh =
			MeshBuilder.CreateBox(
				`${baseName}-doorframe-lintel`,
				{
					width: isHorizontal ? DOORWAY_WIDTH + postWidth * 2 : wallThickness,
					height: 0.25,
					depth: isHorizontal ? wallThickness : DOORWAY_WIDTH + postWidth * 2
				},
				scene);

		lintel.material = frameMaterial;
		lintel.position.x =
			center.x;
		lintel.position.y =
			ISLAND_GROUND_Y + postHeight + 0.125;
		lintel.position.z =
			center.z;

		this.disposables.push(lintel);
	}

	/**
	 * Create a checkerboard DynamicTexture for floor patterns.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param name
	 * Texture name.
	 * @param primaryHex
	 * Primary tile color hex.
	 * @param accentHex
	 * Accent tile color hex.
	 * @returns The generated DynamicTexture.
	 */
	private createCheckerboardTexture(
		scene: Scene,
		name: string,
		primaryHex: string,
		accentHex: string): DynamicTexture
	{
		const texture: DynamicTexture =
			new DynamicTexture(
				name,
				CHECKERBOARD_TEXTURE_SIZE,
				scene,
				false);

		const ctx: ICanvasRenderingContext | null =
			texture.getContext();
		const tileSize: number =
			CHECKERBOARD_TEXTURE_SIZE / CHECKERBOARD_TILE_COUNT;

		if (ctx != null)
		{
			for (let row: number = 0; row < CHECKERBOARD_TILE_COUNT; row++)
			{
				for (let col: number = 0; col < CHECKERBOARD_TILE_COUNT; col++)
				{
					ctx.fillStyle =
						(row + col) % 2 === 0
							? primaryHex
							: accentHex;

					ctx.fillRect(
						col * tileSize,
						row * tileSize,
						tileSize,
						tileSize);
				}
			}

			texture.update();
		}
		this.disposables.push(texture);

		return texture;
	}
}