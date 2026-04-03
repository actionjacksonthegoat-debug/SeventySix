// <copyright file="furniture.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Furniture Service.
 * Manages furniture meshes in rooms. Furniture serves as searchable containers
 * for items and traps.
 * Single Responsibility: furniture geometry and proximity queries only.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

import { distanceXZ } from "@games/shared/utilities/math.utility";

import {
	FURNITURE_BARREL_COLOR,
	FURNITURE_BOOKSHELF_COLOR,
	FURNITURE_CABINET_COLOR,
	FURNITURE_CRATE_COLOR,
	FURNITURE_DESK_COLOR,
	FURNITURE_SEARCH_RADIUS,
	ISLAND_GROUND_Y,
	ISLAND_ROOMS,
	ROOM_FURNITURE
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { FurnitureType, RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { FurnitureDefinition, RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/** Disposable scene object contract. */
interface Disposable
{
	/** Release resources. */
	dispose(): void;
}

/** Furniture type to color mapping. */
const FURNITURE_COLORS: ReadonlyMap<FurnitureType, string> =
	new Map<FurnitureType, string>(
		[
			[FurnitureType.Barrel, FURNITURE_BARREL_COLOR],
			[FurnitureType.Crate, FURNITURE_CRATE_COLOR],
			[FurnitureType.Desk, FURNITURE_DESK_COLOR],
			[FurnitureType.Cabinet, FURNITURE_CABINET_COLOR],
			[FurnitureType.Bookshelf, FURNITURE_BOOKSHELF_COLOR]
		]);

/**
 * Manages furniture mesh creation and spatial queries for room furniture.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class FurnitureService
{
	/** References to disposable scene objects. */
	private readonly disposables: Disposable[] = [];

	/**
	 * Create furniture meshes for all rooms in the scene.
	 * @param scene
	 * The Babylon.js Scene to populate.
	 */
	initialize(scene: Scene): void
	{
		for (const furniture of ROOM_FURNITURE)
		{
			const room: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) => room.id === furniture.roomId);

			if (room === undefined)
			{
				continue;
			}

			this.createFurnitureMesh(
				scene,
				furniture,
				room);
		}
	}

	/**
	 * Get furniture near a position within search radius.
	 * @param positionX
	 * World X position.
	 * @param positionZ
	 * World Z position.
	 * @returns The nearest furniture definition within range, or null.
	 */
	getNearbyFurniture(
		positionX: number,
		positionZ: number): FurnitureDefinition | null
	{
		let nearest: FurnitureDefinition | null = null;
		let nearestDistance: number =
			FURNITURE_SEARCH_RADIUS;

		for (const furniture of ROOM_FURNITURE)
		{
			const room: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) => room.id === furniture.roomId);

			if (room === undefined)
			{
				continue;
			}

			const worldX: number =
				room.centerX + furniture.offsetX;
			const worldZ: number =
				room.centerZ + furniture.offsetZ;

			const distance: number =
				distanceXZ(positionX, positionZ, worldX, worldZ);

			if (distance < nearestDistance)
			{
				nearestDistance = distance;
				nearest = furniture;
			}
		}

		return nearest;
	}

	/**
	 * Get all furniture in a specific room.
	 * @param roomId
	 * The room identifier.
	 * @returns Furniture definitions for the room.
	 */
	getFurnitureInRoom(
		roomId: RoomId): ReadonlyArray<FurnitureDefinition>
	{
		return ROOM_FURNITURE.filter(
			(furniture) =>
				furniture.roomId === roomId);
	}

	/**
	 * Clean up all furniture meshes and materials.
	 */
	dispose(): void
	{
		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
	}

	/**
	 * Create a mesh for a single furniture piece.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furniture
	 * The furniture definition.
	 * @param room
	 * The room containing this furniture.
	 */
	private createFurnitureMesh(
		scene: Scene,
		furniture: FurnitureDefinition,
		room: RoomDefinition): void
	{
		const mesh: Mesh =
			this.createGeometry(
				scene,
				furniture);

		const material: StandardMaterial =
			new StandardMaterial(
				`furniture-material-${furniture.id}`,
				scene);

		const colorHex: string =
			FURNITURE_COLORS.get(furniture.type) ?? FURNITURE_CRATE_COLOR;

		material.diffuseColor =
			Color3.FromHexString(colorHex);
		material.specularColor =
			new Color3(0.1, 0.1, 0.1);

		mesh.material = material;
		mesh.position.x =
			room.centerX + furniture.offsetX;
		mesh.position.z =
			room.centerZ + furniture.offsetZ;

		this.disposables.push(mesh);
		this.disposables.push(material);
	}

	/**
	 * Create the appropriate geometry for a furniture type.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furniture
	 * The furniture definition.
	 * @returns The created mesh.
	 */
	private createGeometry(
		scene: Scene,
		furniture: FurnitureDefinition): Mesh
	{
		switch (furniture.type)
		{
			case FurnitureType.Barrel:
				return this.createBarrel(scene, furniture.id);
			case FurnitureType.Crate:
				return this.createCrate(scene, furniture.id);
			case FurnitureType.Desk:
				return this.createDesk(scene, furniture.id);
			case FurnitureType.Cabinet:
				return this.createCabinet(scene, furniture.id);
			case FurnitureType.Bookshelf:
				return this.createBookshelf(scene, furniture.id);
		}
	}

	/**
	 * Create a barrel mesh (cylinder with bands).
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furnitureId
	 * Unique furniture identifier.
	 * @returns The barrel mesh.
	 */
	private createBarrel(
		scene: Scene,
		furnitureId: string): Mesh
	{
		const barrel: Mesh =
			MeshBuilder.CreateCylinder(
				`furniture-${furnitureId}`,
				{
					diameter: 1.4,
					height: 2.0,
					tessellation: 16
				},
				scene);

		barrel.position.y =
			ISLAND_GROUND_Y + 1.0;

		const bandMaterial: StandardMaterial =
			new StandardMaterial(
				`furniture-band-${furnitureId}`,
				scene);

		bandMaterial.diffuseColor =
			new Color3(0.2, 0.15, 0.1);

		for (const bandY of [0.4, -0.4])
		{
			const band: Mesh =
				MeshBuilder.CreateTorus(
					`furniture-band-${furnitureId}-${bandY}`,
					{
						diameter: 1.45,
						thickness: 0.08,
						tessellation: 16
					},
					scene);

			band.material = bandMaterial;
			band.parent = barrel;
			band.position.y = bandY;

			this.disposables.push(band);
		}

		this.disposables.push(bandMaterial);

		return barrel;
	}

	/**
	 * Create a crate mesh (box with cross strips).
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furnitureId
	 * Unique furniture identifier.
	 * @returns The crate mesh.
	 */
	private createCrate(
		scene: Scene,
		furnitureId: string): Mesh
	{
		const crate: Mesh =
			MeshBuilder.CreateBox(
				`furniture-${furnitureId}`,
				{
					width: 1.7,
					height: 1.4,
					depth: 1.7
				},
				scene);

		crate.position.y =
			ISLAND_GROUND_Y + 0.7;

		const stripMaterial: StandardMaterial =
			new StandardMaterial(
				`furniture-strip-${furnitureId}`,
				scene);

		stripMaterial.diffuseColor =
			new Color3(0.35, 0.25, 0.15);

		const horizontalStrip: Mesh =
			MeshBuilder.CreateBox(
				`furniture-strip-h-${furnitureId}`,
				{
					width: 1.72,
					height: 0.08,
					depth: 1.72
				},
				scene);

		horizontalStrip.material = stripMaterial;
		horizontalStrip.parent = crate;
		horizontalStrip.position.y = 0;

		this.disposables.push(horizontalStrip);
		this.disposables.push(stripMaterial);

		return crate;
	}

	/**
	 * Create a desk mesh (tabletop with four legs).
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furnitureId
	 * Unique furniture identifier.
	 * @returns The desk mesh.
	 */
	private createDesk(
		scene: Scene,
		furnitureId: string): Mesh
	{
		const desk: Mesh =
			MeshBuilder.CreateBox(
				`furniture-${furnitureId}`,
				{
					width: 2.5,
					height: 0.15,
					depth: 1.4
				},
				scene);

		desk.position.y =
			ISLAND_GROUND_Y + 1.1;

		const legMaterial: StandardMaterial =
			new StandardMaterial(
				`furniture-leg-${furnitureId}`,
				scene);

		legMaterial.diffuseColor =
			new Color3(0.3, 0.2, 0.12);

		const legPositions: ReadonlyArray<[number, number]> =
			[[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]];

		for (const [legX, legZ] of legPositions)
		{
			const leg: Mesh =
				MeshBuilder.CreateBox(
					`furniture-leg-${furnitureId}-${legX}-${legZ}`,
					{
						width: 0.12,
						height: 1.05,
						depth: 0.12
					},
					scene);

			leg.material = legMaterial;
			leg.parent = desk;
			leg.position.x = legX;
			leg.position.y = -0.6;
			leg.position.z = legZ;

			this.disposables.push(leg);
		}

		this.disposables.push(legMaterial);

		return desk;
	}

	/**
	 * Create a cabinet mesh (tall box with drawer divisions).
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furnitureId
	 * Unique furniture identifier.
	 * @returns The cabinet mesh.
	 */
	private createCabinet(
		scene: Scene,
		furnitureId: string): Mesh
	{
		const cabinet: Mesh =
			MeshBuilder.CreateBox(
				`furniture-${furnitureId}`,
				{
					width: 1.3,
					height: 2.2,
					depth: 0.9
				},
				scene);

		cabinet.position.y =
			ISLAND_GROUND_Y + 1.1;

		const dividerMaterial: StandardMaterial =
			new StandardMaterial(
				`furniture-divider-${furnitureId}`,
				scene);

		dividerMaterial.diffuseColor =
			new Color3(0.15, 0.12, 0.08);

		const drawerCount: number = 3;

		for (let i: number = 0; i < drawerCount; i++)
		{
			const dividerY: number =
				-0.7 + (i + 1) * (1.8 / (drawerCount + 1));

			const divider: Mesh =
				MeshBuilder.CreateBox(
					`furniture-divider-${furnitureId}-${i}`,
					{
						width: 1.32,
						height: 0.05,
						depth: 0.92
					},
					scene);

			divider.material = dividerMaterial;
			divider.parent = cabinet;
			divider.position.y = dividerY;

			this.disposables.push(divider);

			const handle: Mesh =
				MeshBuilder.CreateBox(
					`furniture-handle-${furnitureId}-${i}`,
					{
						width: 0.28,
						height: 0.05,
						depth: 0.03
					},
					scene);

			handle.material = dividerMaterial;
			handle.parent = cabinet;
			handle.position.y =
				dividerY + 0.2;
			handle.position.z = 0.47;

			this.disposables.push(handle);
		}

		this.disposables.push(dividerMaterial);

		return cabinet;
	}

	/**
	 * Create a bookshelf mesh (tall frame with shelf divisions).
	 * @param scene
	 * The Babylon.js Scene.
	 * @param furnitureId
	 * Unique furniture identifier.
	 * @returns The bookshelf mesh.
	 */
	private createBookshelf(
		scene: Scene,
		furnitureId: string): Mesh
	{
		const bookshelf: Mesh =
			MeshBuilder.CreateBox(
				`furniture-${furnitureId}`,
				{
					width: 2.0,
					height: 2.5,
					depth: 0.6
				},
				scene);

		bookshelf.position.y =
			ISLAND_GROUND_Y + 1.25;

		const shelfMaterial: StandardMaterial =
			new StandardMaterial(
				`furniture-shelf-${furnitureId}`,
				scene);

		shelfMaterial.diffuseColor =
			new Color3(0.25, 0.18, 0.1);

		const shelfCount: number = 4;

		for (let i: number = 0; i < shelfCount; i++)
		{
			const shelfY: number =
				-0.9 + (i + 1) * (2.0 / (shelfCount + 1));

			const shelf: Mesh =
				MeshBuilder.CreateBox(
					`furniture-shelf-${furnitureId}-${i}`,
					{
						width: 1.9,
						height: 0.06,
						depth: 0.55
					},
					scene);

			shelf.material = shelfMaterial;
			shelf.parent = bookshelf;
			shelf.position.y = shelfY;

			this.disposables.push(shelf);
		}

		this.disposables.push(shelfMaterial);

		return bookshelf;
	}
}