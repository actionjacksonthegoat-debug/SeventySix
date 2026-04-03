// <copyright file="item.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Item Service.
 * Manages mission item spawning, world placement, and collection mechanics.
 * Single Responsibility: item lifecycle only. No spy state, no trap logic.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";

import { distanceXZ } from "@games/shared/utilities/math.utility";

import {
	ISLAND_ROOMS,
	ITEM_COLLECTION_RADIUS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	ItemType,
	SpyIdentity
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { RoomDefinition, WorldItem } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/** Item visual configurations. */
interface ItemVisual
{
	/** Mesh creation factory. */
	readonly createMesh: (name: string, scene: Scene) => Mesh;

	/** Diffuse color. */
	readonly color: Color3;
}

/** Visual configuration per item type. */
const ITEM_VISUALS: ReadonlyMap<ItemType, ItemVisual> =
	new Map<ItemType, ItemVisual>(
		[
			[
				ItemType.SecretDocuments,
				{
					createMesh: (name: string, scene: Scene): Mesh =>
						MeshBuilder.CreateBox(
							name,
							{
								width: 0.6,
								height: 0.1,
								depth: 0.8
							},
							scene),
					color: Color3.FromHexString("#F5F5DC")
				}
			],
			[
				ItemType.Passport,
				{
					createMesh: (name: string, scene: Scene): Mesh =>
						MeshBuilder.CreateBox(
							name,
							{
								width: 0.4,
								height: 0.05,
								depth: 0.6
							},
							scene),
					color: Color3.FromHexString("#003080")
				}
			],
			[
				ItemType.KeyCard,
				{
					createMesh: (name: string, scene: Scene): Mesh =>
						MeshBuilder.CreateBox(
							name,
							{
								width: 0.4,
								height: 0.02,
								depth: 0.6
							},
							scene),
					color: Color3.FromHexString("#FFD700")
				}
			],
			[
				ItemType.MoneyBag,
				{
					createMesh: (name: string, scene: Scene): Mesh =>
						MeshBuilder.CreateSphere(
							name,
							{ diameter: 0.7 },
							scene),
					color: Color3.FromHexString("#2E8B57")
				}
			]
		]);

/** Item float height in world units. */
const ITEM_FLOAT_Y: number = 0.5;

/** Maximum random offset from room center for item placement. */
const ITEM_SPAWN_OFFSET: number = 3;

/** Counter for generating unique item instance IDs. */
let itemInstanceCounter: number = 0;

/**
 * Manages mission item spawning, world placement, and collection mechanics.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class ItemService
{
	/** All world items in the game. */
	private readonly items: WorldItem[] = [];

	/** Meshes associated with items by instanceId. */
	private readonly meshes: Map<string, Mesh> =
		new Map<string, Mesh>();

	/** Disposable materials for cleanup. */
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/**
	 * Spawns all four mission items in their designated rooms.
	 * Creates visual mesh for each item in the scene.
	 * @param scene
	 * The Babylon.js Scene to create item meshes in.
	 */
	initializeItems(scene: Scene): void
	{
		this.items.length = 0;
		this.meshes.clear();

		const itemTypes: ItemType[] =
			[
				ItemType.SecretDocuments,
				ItemType.Passport,
				ItemType.KeyCard,
				ItemType.MoneyBag
			];

		for (const itemType of itemTypes)
		{
			const spawnRoom: RoomDefinition =
				this.findSpawnRoom(itemType);

			const offsetX: number =
				(Math.random() - 0.5) * 2 * ITEM_SPAWN_OFFSET;
			const offsetZ: number =
				(Math.random() - 0.5) * 2 * ITEM_SPAWN_OFFSET;

			const positionX: number =
				Math.max(
					spawnRoom.centerX - spawnRoom.halfWidth,
					Math.min(
						spawnRoom.centerX + spawnRoom.halfWidth,
						spawnRoom.centerX + offsetX));

			const positionZ: number =
				Math.max(
					spawnRoom.centerZ - spawnRoom.halfDepth,
					Math.min(
						spawnRoom.centerZ + spawnRoom.halfDepth,
						spawnRoom.centerZ + offsetZ));

			const instanceId: string =
				`item-${itemType}-${itemInstanceCounter++}`;

			const worldItem: WorldItem =
				{
					instanceId,
					type: itemType,
					roomId: spawnRoom.id,
					positionX,
					positionZ,
					collected: false,
					furnitureId: null
				};

			this.items.push(worldItem);
			this.createItemMesh(
				worldItem,
				scene);
		}
	}

	/**
	 * Attempts to collect an item at the given world position.
	 * Returns the ItemType if collected, null otherwise.
	 * @param positionX
	 * Spy world-space X position.
	 * @param positionZ
	 * Spy world-space Z position.
	 * @param identity
	 * Which spy is collecting.
	 * @returns
	 * The collected ItemType, or null if nothing within range.
	 */
	tryCollect(
		positionX: number,
		positionZ: number,
		identity: SpyIdentity): ItemType | null
	{
		for (const item of this.items)
		{
			if (item.collected)
			{
				continue;
			}

			const distance: number =
				distanceXZ(positionX, positionZ, item.positionX, item.positionZ);

			if (distance <= ITEM_COLLECTION_RADIUS)
			{
				item.collected = true;
				item.collectedBy = identity;

				const mesh: Mesh | undefined =
					this.meshes.get(item.instanceId);

				if (mesh != null)
				{
					mesh.setEnabled(false);
				}

				return item.type;
			}
		}

		return null;
	}

	/**
	 * Collects an item by its type, marking it as collected for the given identity.
	 * Per-identity: both spies can independently collect the same item type.
	 * Used by SearchService when a furniture search reveals an item.
	 * @param itemType
	 * The type of item found via search.
	 * @param identity
	 * Which spy found the item.
	 * @returns
	 * The matching WorldItem, or null if not found.
	 */
	collectItemByType(
		itemType: ItemType,
		identity: SpyIdentity): WorldItem | null
	{
		const item: WorldItem | undefined =
			this.items.find(
				(candidate) =>
					candidate.type === itemType);

		if (item == null)
		{
			return null;
		}

		/* Mark collected and hide mesh on first collection (either identity). */
		if (!item.collected)
		{
			item.collected = true;
			item.collectedBy = identity;

			const mesh: Mesh | undefined =
				this.meshes.get(item.instanceId);

			if (mesh != null)
			{
				mesh.setEnabled(false);
			}
		}

		return item;
	}

	/**
	 * Returns all WorldItem instances not yet collected.
	 * @returns
	 * Read-only array of uncollected items.
	 */
	getUncollectedItems(): ReadonlyArray<WorldItem>
	{
		return this.items.filter(
			(item) => !item.collected);
	}

	/**
	 * Returns all WorldItem instances collected by a specific spy.
	 * @param identity
	 * The spy identity to filter by.
	 * @returns
	 * Read-only array of items collected by the specified spy.
	 */
	getCollectedByIdentity(identity: SpyIdentity): ReadonlyArray<WorldItem>
	{
		return this.items.filter(
			(item) => item.collectedBy === identity);
	}

	/**
	 * Resets all items to their initial uncollected state (for restart).
	 * @param scene
	 * The Babylon.js Scene to recreate meshes in.
	 */
	reset(scene: Scene): void
	{
		this.dispose();
		this.initializeItems(scene);
	}

	/**
	 * Disposes all item meshes and materials.
	 */
	dispose(): void
	{
		for (const mesh of this.meshes.values())
		{
			mesh.dispose();
		}

		this.meshes.clear();

		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
		this.items.length = 0;
	}

	/**
	 * Finds the room designated for spawning a specific item type.
	 * Prefers rooms with exclusive spawnable items, falls back to any matching room.
	 * @param itemType
	 * The item type to find a spawn room for.
	 * @returns
	 * The room definition for spawning the item.
	 */
	private findSpawnRoom(itemType: ItemType): RoomDefinition
	{
		const exclusive: RoomDefinition | undefined =
			ISLAND_ROOMS.find(
				(candidate) =>
				{
					return candidate.spawnableItems.includes(itemType)
						&& candidate.spawnableItems.length === 1;
				});

		return exclusive ?? ISLAND_ROOMS.find(
			(candidate) =>
			{
				return candidate.spawnableItems.includes(itemType);
			})!;
	}

	/**
	 * Create a visual mesh for an item.
	 * @param worldItem
	 * The world item data.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createItemMesh(
		worldItem: WorldItem,
		scene: Scene): void
	{
		const visual: ItemVisual | undefined =
			ITEM_VISUALS.get(worldItem.type);

		if (visual == null)
		{
			return;
		}

		const mesh: Mesh =
			visual.createMesh(
				worldItem.instanceId,
				scene);

		const material: StandardMaterial =
			new StandardMaterial(
				`${worldItem.instanceId}-mat`,
				scene);

		material.diffuseColor =
			visual.color;
		material.emissiveColor =
			visual.color.scale(0.3);

		mesh.material = material;
		mesh.position.set(
			worldItem.positionX,
			ITEM_FLOAT_Y,
			worldItem.positionZ);

		mesh.metadata =
			{ itemInstanceId: worldItem.instanceId };

		/* Items are hidden in furniture — not visible until collected. */
		mesh.setEnabled(false);

		this.meshes.set(
			worldItem.instanceId,
			mesh);
		this.disposables.push(material);
	}
}