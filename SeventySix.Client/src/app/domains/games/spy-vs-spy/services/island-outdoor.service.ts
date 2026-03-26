// <copyright file="island-outdoor.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Island Outdoor Service.
 * Creates procedural trees and rocks around the island perimeter and in interstitial spaces.
 * Single Responsibility: outdoor decoration geometry only.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

import {
	ISLAND_GROUND_Y,
	ISLAND_ROOMS,
	ISLAND_SIZE,
	OUTSIDE_AREA_DEPTH,
	OUTSIDE_TREE_COUNT,
	ROCK_COLOR,
	TREE_CANOPY_COLOR,
	TREE_CANOPY_DIAMETER,
	TREE_CANOPY_HEIGHT,
	TREE_SCALE_MULTIPLIER,
	TREE_TRUNK_COLOR,
	TREE_TRUNK_DIAMETER,
	TREE_TRUNK_HEIGHT
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";

/** Parameters for creating a procedural tree. */
interface CreateTreeParams
{
	/** The Babylon.js Scene. */
	readonly scene: Scene;
	/** World X position. */
	readonly posX: number;
	/** World Z position. */
	readonly posZ: number;
	/** Tree index for unique naming. */
	readonly index: number;
	/** Material for the trunk. */
	readonly trunkMaterial: StandardMaterial;
	/** Optional uniform scale multiplier (default 1.0). */
	readonly scale?: number;
}

/**
 * Manages outdoor decoration for the Spy vs Spy island scene.
 * Creates trees, rocks, and perimeter vegetation.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class IslandOutdoorService
{
	/** References to disposable scene objects. */
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/**
	 * Create all outdoor decorations for the island.
	 * @param scene
	 * The Babylon.js Scene to populate.
	 */
	initialize(scene: Scene): void
	{
		this.createOutsideDecor(scene);
	}

	/**
	 * Dispose all created meshes and materials.
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
	 * Create outside decorations: procedural trees and rocks around the island perimeter.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createOutsideDecor(scene: Scene): void
	{
		const halfExtent: number =
			ISLAND_SIZE / 2 + OUTSIDE_AREA_DEPTH / 2;

		const trunkMaterial: StandardMaterial =
			new StandardMaterial("tree-trunk-material", scene);

		trunkMaterial.diffuseColor =
			Color3.FromHexString(TREE_TRUNK_COLOR);

		const canopyMaterial: StandardMaterial =
			new StandardMaterial("tree-canopy-material", scene);

		canopyMaterial.diffuseColor =
			Color3.FromHexString(TREE_CANOPY_COLOR);

		const rockMaterial: StandardMaterial =
			new StandardMaterial("rock-material", scene);

		rockMaterial.diffuseColor =
			Color3.FromHexString(ROCK_COLOR);
		rockMaterial.specularColor =
			new Color3(0.15, 0.15, 0.15);

		this.disposables.push(trunkMaterial);
		this.disposables.push(canopyMaterial);
		this.disposables.push(rockMaterial);

		this.distributePerimeterTrees(
			scene,
			halfExtent,
			trunkMaterial,
			canopyMaterial);

		this.createPerimeterRocks(
			scene,
			halfExtent,
			rockMaterial);

		this.createInterstitialTrees(
			scene,
			trunkMaterial,
			canopyMaterial);
	}

	/**
	 * Distribute procedural trees along all four perimeter edges.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param halfExtent
	 * Half the island extent including outside area.
	 * @param trunkMaterial
	 * Material for the tree trunks.
	 * @param canopyMaterial
	 * Material for the tree canopies.
	 */
	private distributePerimeterTrees(
		scene: Scene,
		halfExtent: number,
		trunkMaterial: StandardMaterial,
		canopyMaterial: StandardMaterial): void
	{
		const treesPerEdge: number =
			Math.ceil(OUTSIDE_TREE_COUNT / 4);
		const edgeLength: number =
			ISLAND_SIZE + OUTSIDE_AREA_DEPTH * 2;
		const spacing: number =
			edgeLength / (treesPerEdge + 1);

		let treeIndex: number = 0;

		for (let edge: number = 0; edge < 4; edge++)
		{
			for (let idx: number = 0; idx < treesPerEdge; idx++)
			{
				const offset: number =
					-edgeLength / 2 + spacing * (idx + 1);
				const isNorthSouth: boolean =
					edge < 2;
				const sign: number =
					edge % 2 === 0 ? -1 : 1;
				const treeX: number =
					isNorthSouth ? offset : sign * halfExtent;
				const treeZ: number =
					isNorthSouth ? sign * halfExtent : offset;

				this.createTree(
					{
						scene,
						posX: treeX,
						posZ: treeZ,
						index: treeIndex,
						trunkMaterial,
						scale: 0.55 * TREE_SCALE_MULTIPLIER
					},
					canopyMaterial);

				treeIndex++;
			}
		}
	}

	/**
	 * Create decorative rocks at the four perimeter corners.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param halfExtent
	 * Half the island extent including outside area.
	 * @param rockMaterial
	 * Material for the rocks.
	 */
	private createPerimeterRocks(
		scene: Scene,
		halfExtent: number,
		rockMaterial: StandardMaterial): void
	{
		const rockPositions: ReadonlyArray<{ x: number; z: number; }> =
			[
				{ x: -halfExtent + 3, z: -halfExtent + 3 },
				{ x: halfExtent - 3, z: -halfExtent + 3 },
				{ x: -halfExtent + 3, z: halfExtent - 3 },
				{ x: halfExtent - 3, z: halfExtent - 3 }
			];

		for (let rockIdx: number = 0; rockIdx < rockPositions.length; rockIdx++)
		{
			const pos: { x: number; z: number; } =
				rockPositions[rockIdx];

			this.createRock(
				scene,
				pos.x,
				pos.z,
				rockIdx,
				rockMaterial);
		}
	}

	/**
	 * Create a procedural tree (cylinder trunk + sphere canopy).
	 * @param params
	 * Tree creation parameters.
	 * @param canopyMaterial
	 * Material for the canopy.
	 */
	private createTree(
		params: CreateTreeParams,
		canopyMaterial: StandardMaterial): void
	{
		const scale: number =
			params.scale ?? 1.0;

		const trunkHeight: number =
			TREE_TRUNK_HEIGHT * scale;

		const trunk: Mesh =
			MeshBuilder.CreateCylinder(
				`tree-trunk-${params.index}`,
				{
					diameter: TREE_TRUNK_DIAMETER * scale,
					height: trunkHeight
				},
				params.scene);

		trunk.material =
			params.trunkMaterial;
		trunk.position.x =
			params.posX;
		trunk.position.y =
			ISLAND_GROUND_Y + trunkHeight / 2;
		trunk.position.z =
			params.posZ;

		const canopyHeight: number =
			TREE_CANOPY_HEIGHT * scale;

		const canopy: Mesh =
			MeshBuilder.CreateSphere(
				`tree-canopy-${params.index}`,
				{
					diameterX: TREE_CANOPY_DIAMETER * scale,
					diameterY: canopyHeight,
					diameterZ: TREE_CANOPY_DIAMETER * scale
				},
				params.scene);

		canopy.material = canopyMaterial;
		canopy.position.x =
			params.posX;
		canopy.position.y =
			ISLAND_GROUND_Y + trunkHeight + canopyHeight / 2 - 0.5;
		canopy.position.z =
			params.posZ;

		this.disposables.push(trunk);
		this.disposables.push(canopy);
	}

	/**
	 * Create a procedural rock (flattened sphere).
	 * @param scene
	 * The Babylon.js Scene.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @param index
	 * Rock index for unique naming.
	 * @param rockMaterial
	 * Material for the rock.
	 */
	private createRock(
		scene: Scene,
		posX: number,
		posZ: number,
		index: number,
		rockMaterial: StandardMaterial): void
	{
		const rock: Mesh =
			MeshBuilder.CreateSphere(
				`rock-${index}`,
				{
					diameter: 2,
					segments: 8
				},
				scene);

		rock.material = rockMaterial;
		rock.position.x = posX;
		rock.position.y =
			ISLAND_GROUND_Y + 0.3;
		rock.position.z = posZ;
		rock.scaling.y = 0.4;

		this.disposables.push(rock);
	}

	/**
	 * Create palm trees scattered in the sandy spaces between rooms.
	 * Uses deterministic positions in open areas to avoid corridors and rooms.
	 * @param scene
	 * The Babylon.js Scene.
	 * @param trunkMaterial
	 * Material for the tree trunks.
	 * @param canopyMaterial
	 * Material for the tree canopies.
	 */
	private createInterstitialTrees(
		scene: Scene,
		trunkMaterial: StandardMaterial,
		canopyMaterial: StandardMaterial): void
	{
		/* Place trees in known open corners between the 2×3 room grid. */
		const openPositions: ReadonlyArray<{ x: number; z: number; }> =
			[
				{ x: -14, z: -8 },
				{ x: 14, z: -8 },
				{ x: -14, z: 8 },
				{ x: 14, z: 8 },
				{ x: -28, z: -36 },
				{ x: 0, z: -36 },
				{ x: 28, z: -36 },
				{ x: -36, z: -30 },
				{ x: 36, z: -30 },
				{ x: -36, z: 30 },
				{ x: 36, z: 30 }
			];

		let treeIndex: number = 200;

		for (const pos of openPositions)
		{
			if (this.isInsideAnyRoom(pos.x, pos.z))
			{
				continue;
			}

			this.createTree(
				{
					scene,
					posX: pos.x,
					posZ: pos.z,
					index: treeIndex,
					trunkMaterial,
					scale: 0.35 * TREE_SCALE_MULTIPLIER
				},
				canopyMaterial);

			treeIndex++;
		}
	}

	/**
	 * Check if a position is inside any room's bounds.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @returns True if the position is inside a room.
	 */
	private isInsideAnyRoom(
		posX: number,
		posZ: number): boolean
	{
		for (const room of ISLAND_ROOMS)
		{
			if (
				posX >= room.centerX - room.halfWidth
					&& posX <= room.centerX + room.halfWidth
					&& posZ >= room.centerZ - room.halfDepth
					&& posZ <= room.centerZ + room.halfDepth)
			{
				return true;
			}
		}

		return false;
	}
}