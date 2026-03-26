// <copyright file="trap.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Trap Service.
 * Manages trap placement, world visuals, and trigger detection.
 * Single Responsibility: trap lifecycle only. No spy movement, no item logic.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";

import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Shaders/default.fragment";

import { TRAP_TRIGGER_RADIUS } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { INITIAL_TRAP_COUNT_PER_TYPE } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	SpyIdentity,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type {
	PlacedTrap,
	PlaceTrapParams
} from "@games/spy-vs-spy/models/spy-vs-spy.models";

/** Y position for trap meshes (sitting on the ground). */
const TRAP_GROUND_Y: number = 0.1;

/** Counter for generating unique trap instance IDs. */
let trapInstanceCounter: number = 0;

/**
 * Manages trap placement, world visuals, and trigger detection.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class TrapService
{
	/** All placed traps in the game. */
	private readonly traps: PlacedTrap[] = [];

	/** Meshes associated with traps by instanceId. */
	private readonly meshes: Map<string, Mesh> =
		new Map<string, Mesh>();

	/** Disposable materials for cleanup. */
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/** Per-type trap inventory for Black spy. */
	private readonly blackInventory: Map<TrapType, number> =
		new Map<TrapType, number>();

	/** Per-type trap inventory for White spy. */
	private readonly whiteInventory: Map<TrapType, number> =
		new Map<TrapType, number>();

	/** Initialize inventories on construction. */
	constructor()
	{
		this.initializeInventory();
	}

	/**
	 * Checks whether the given spy can place a trap of the specified type.
	 * @param identity
	 * The spy identity.
	 * @param type
	 * The trap type to check.
	 * @returns
	 * True if the spy has inventory for that trap type.
	 */
	canPlaceTrap(
		identity: SpyIdentity,
		type: TrapType): boolean
	{
		const inventory: Map<TrapType, number> =
			identity === SpyIdentity.Black
				? this.blackInventory
				: this.whiteInventory;

		return (inventory.get(type) ?? 0) > 0;
	}

	/**
	 * Consumes one trap of the given type from the spy's inventory.
	 * @param identity
	 * The spy identity.
	 * @param type
	 * The trap type to consume.
	 */
	consumeTrap(
		identity: SpyIdentity,
		type: TrapType): void
	{
		const inventory: Map<TrapType, number> =
			identity === SpyIdentity.Black
				? this.blackInventory
				: this.whiteInventory;
		const current: number =
			inventory.get(type) ?? 0;

		inventory.set(type, Math.max(0, current - 1));
	}

	/**
	 * Replenishes one trap of the given type in the spy's inventory.
	 * @param identity
	 * The spy identity.
	 * @param type
	 * The trap type to replenish.
	 */
	replenishTrap(
		identity: SpyIdentity,
		type: TrapType): void
	{
		const inventory: Map<TrapType, number> =
			identity === SpyIdentity.Black
				? this.blackInventory
				: this.whiteInventory;

		inventory.set(type, INITIAL_TRAP_COUNT_PER_TYPE);
	}

	/**
	 * Returns trap types that the spy currently has in inventory.
	 * @param identity
	 * The spy identity.
	 * @returns
	 * Array of available trap types.
	 */
	getAvailableTrapTypes(identity: SpyIdentity): TrapType[]
	{
		const inventory: Map<TrapType, number> =
			identity === SpyIdentity.Black
				? this.blackInventory
				: this.whiteInventory;
		const available: TrapType[] = [];

		for (const [type, count] of inventory)
		{
			if (count > 0)
			{
				available.push(type);
			}
		}

		return available;
	}

	/**
	 * Places a trap of the given type in the scene at the specified position.
	 * Returns the created PlacedTrap, or null if the room already has an active trap.
	 * @param params
	 * Trap placement parameters.
	 * @param type
	 * The type of trap to place.
	 * @param furnitureId
	 * Optional furniture ID if the trap is placed on furniture.
	 * @returns
	 * The created PlacedTrap, or null if the room already has an active trap.
	 */
	placeTrap(
		params: PlaceTrapParams,
		type: TrapType,
		furnitureId: string | null = null): PlacedTrap | null
	{
		const roomHasActiveTrap: boolean =
			this.traps.some(
				(trap) =>
				{
					return trap.roomId === params.roomId
						&& !trap.triggered;
				});

		if (roomHasActiveTrap)
		{
			return null;
		}

		const instanceId: string =
			`trap-${type}-${trapInstanceCounter++}`;

		const placedTrap: PlacedTrap =
			{
				instanceId,
				type,
				roomId: params.roomId,
				positionX: params.positionX,
				positionZ: params.positionZ,
				placedBy: params.placedBy,
				triggered: false,
				furnitureId
			};

		this.traps.push(placedTrap);
		this.createTrapMesh(
			placedTrap,
			params.scene);

		return placedTrap;
	}

	/**
	 * Checks whether the given spy has walked into any active trap.
	 * Returns the triggered trap, or null if none triggered.
	 * Any spy can trigger any trap — including traps they placed themselves.
	 * @param spyIdentity
	 * Which spy to check triggers for.
	 * @param positionX
	 * Spy world-space X position.
	 * @param positionZ
	 * Spy world-space Z position.
	 * @returns
	 * The triggered PlacedTrap, or null if none triggered.
	 */
	checkTriggers(
		spyIdentity: SpyIdentity,
		positionX: number,
		positionZ: number): PlacedTrap | null
	{
		for (const trap of this.traps)
		{
			if (trap.triggered)
			{
				continue;
			}

			const deltaX: number =
				positionX - trap.positionX;
			const deltaZ: number =
				positionZ - trap.positionZ;
			const distance: number =
				Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);

			if (distance <= TRAP_TRIGGER_RADIUS)
			{
				trap.triggered = true;

				const mesh: Mesh | undefined =
					this.meshes.get(trap.instanceId);

				if (mesh != null)
				{
					mesh.setEnabled(false);
				}

				return trap;
			}
		}

		return null;
	}

	/**
	 * Returns the number of currently active (untriggered) traps.
	 * @returns
	 * The count of active traps.
	 */
	getActiveTrapCount(): number
	{
		return this
			.traps
			.filter(
				(trap) => !trap.triggered)
			.length;
	}

	/**
	 * Returns all active (untriggered) traps.
	 * @returns
	 * Array of active PlacedTrap entries.
	 */
	getActiveTraps(): PlacedTrap[]
	{
		return this.traps.filter(
			(trap) => !trap.triggered);
	}

	/**
	 * Resets all traps — removes meshes, clears state, and restores inventories.
	 * Used on game restart.
	 */
	reset(): void
	{
		for (const [, mesh] of this.meshes)
		{
			mesh.dispose();
		}

		this.meshes.clear();
		this.traps.length = 0;
		this.initializeInventory();
	}

	/**
	 * Disposes all trap meshes and materials.
	 */
	dispose(): void
	{
		this.reset();

		for (const disposable of this.disposables)
		{
			disposable.dispose();
		}

		this.disposables.length = 0;
	}

	/**
	 * Initializes per-type trap inventories for both spies.
	 */
	private initializeInventory(): void
	{
		this.blackInventory.set(TrapType.Bomb, INITIAL_TRAP_COUNT_PER_TYPE);
		this.blackInventory.set(TrapType.SpringTrap, INITIAL_TRAP_COUNT_PER_TYPE);
		this.whiteInventory.set(TrapType.Bomb, INITIAL_TRAP_COUNT_PER_TYPE);
		this.whiteInventory.set(TrapType.SpringTrap, INITIAL_TRAP_COUNT_PER_TYPE);
	}

	/**
	 * Creates the visual mesh for a trap in the scene.
	 * @param trap
	 * The placed trap to create a mesh for.
	 * @param scene
	 * The Babylon.js Scene.
	 */
	private createTrapMesh(
		trap: PlacedTrap,
		scene: Scene): void
	{
		const mesh: Mesh =
			this.buildTrapGeometry(
				trap,
				scene);

		mesh.position.x =
			trap.positionX;
		mesh.position.y = TRAP_GROUND_Y;
		mesh.position.z =
			trap.positionZ;
		mesh.metadata =
			{ trapInstanceId: trap.instanceId };

		const material: StandardMaterial =
			new StandardMaterial(
				`mat-${trap.instanceId}`,
				scene);

		if (trap.type === TrapType.Bomb)
		{
			material.diffuseColor =
				Color3.FromHexString("#333333");
		}
		else
		{
			material.diffuseColor =
				Color3.FromHexString("#C0C0C0");
		}

		mesh.material = material;
		this.disposables.push(material);
		this.meshes.set(
			trap.instanceId,
			mesh);
	}

	/**
	 * Builds the geometry mesh for a trap based on its type.
	 * @param trap
	 * The placed trap to build geometry for.
	 * @param scene
	 * The Babylon.js Scene.
	 * @returns
	 * The created Mesh.
	 */
	private buildTrapGeometry(
		trap: PlacedTrap,
		scene: Scene): Mesh
	{
		if (trap.type === TrapType.Bomb)
		{
			return MeshBuilder.CreateCylinder(
				`trap-${trap.instanceId}`,
				{
					diameter: 0.6,
					height: 0.4
				},
				scene);
		}

		return MeshBuilder.CreateBox(
			`trap-${trap.instanceId}`,
			{
				width: 0.6,
				height: 0.2,
				depth: 0.6
			},
			scene);
	}
}