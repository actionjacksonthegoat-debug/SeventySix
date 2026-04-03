// <copyright file="spy-physics.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Physics Service.
 * Handles movement math for the player-controlled spy.
 * Single Responsibility: movement, rotation, boundary clamping, stun timers.
 * No input handling (reads InputService.keys), no AI logic, no item collection.
 */

import { Injectable } from "@angular/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { IDisposable, IGamePhysicsService } from "@games/shared/models/game-service.interfaces";
import { distanceXZ } from "@games/shared/utilities/math.utility";
import {
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	DOORWAY_WIDTH,
	ISLAND_ROOMS,
	ISLAND_SIZE,
	SPY_MESH_RADIUS,
	SPY_MOVE_SPEED
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { StunState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { RoomDefinition, SpyPhysicsState } from "@games/spy-vs-spy/models/spy-vs-spy.models";

/** Half the island size for boundary clamping. */
const HALF_ISLAND: number =
	ISLAND_SIZE / 2;

/** Wall thickness used for collision AABBs (matches scene). */
const WALL_THICKNESS: number = 0.5;

/** Distance threshold for considering tap-to-move target reached. */
const TAP_TARGET_REACHED_DISTANCE: number = 0.65;

/** Axis-aligned bounding box for wall collision. */
interface WallAABB
{
	/** Minimum X bound. */
	readonly minX: number;
	/** Maximum X bound. */
	readonly maxX: number;
	/** Minimum Z bound. */
	readonly minZ: number;
	/** Maximum Z bound. */
	readonly maxZ: number;
}

/** Parameters for adding a cardinal wall with optional doorway. */
interface CardinalWallParams
{
	/** Accumulating wall array. */
	readonly walls: WallAABB[];
	/** The room definition. */
	readonly room: RoomDefinition;
	/** Rooms connected to this room. */
	readonly connectedRooms: ReadonlyArray<RoomDefinition>;
	/** Half wall thickness. */
	readonly halfW: number;
	/** Predicate to test if a doorway exists in this direction. */
	readonly hasDoorwayPredicate: (r: RoomDefinition) => boolean;
	/** Whether the wall runs along the X axis. */
	readonly isHorizontal: boolean;
	/** The edge coordinate of the wall. */
	readonly wallEdge: number;
	/** Whether this wall has an external exit (e.g., to the airstrip zone). */
	readonly hasExternalExit?: boolean;
}

/** Parameters for adding wall segment(s) with optional doorway gap. */
interface WallSegmentParams
{
	/** Accumulating wall array. */
	readonly walls: WallAABB[];
	/** AABB min X. */
	readonly minX: number;
	/** AABB max X. */
	readonly maxX: number;
	/** AABB min Z. */
	readonly minZ: number;
	/** AABB max Z. */
	readonly maxZ: number;
	/** Whether to split with a doorway gap. */
	readonly hasDoorway: boolean;
	/** True if the wall spans along X axis. */
	readonly isHorizontal: boolean;
	/** Center coordinate for the doorway along the spanning axis. */
	readonly doorwayCenter: number;
}

/**
 * Manages movement, rotation, boundary clamping, and stun timers.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyPhysicsService implements IGamePhysicsService, IDisposable
{
	/** Bound spy TransformNode. */
	private spyNode: TransformNode | null = null;

	/** Current stun state. */
	private currentStunState: StunState =
		StunState.None;

	/** Remaining stun duration in seconds. */
	private stunRemaining: number = 0;

	/** Pre-computed wall AABBs for collision detection. */
	private wallAABBs: ReadonlyArray<WallAABB> = [];

	/** Optional world-space tap target X position. */
	private moveTargetX: number | null = null;

	/** Optional world-space tap target Z position. */
	private moveTargetZ: number | null = null;

	/**
	 * Binds this service to a spy TransformNode and sets spawn position.
	 * @param spyNode
	 * The spy TransformNode to control.
	 * @param spawnX
	 * Initial X position.
	 * @param spawnZ
	 * Initial Z position.
	 */
	initialize(
		spyNode: TransformNode,
		spawnX: number,
		spawnZ: number): void
	{
		this.spyNode = spyNode;
		spyNode.position.x = spawnX;
		spyNode.position.z = spawnZ;
		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
		this.wallAABBs =
			this.buildWallAABBs();
		this.moveTargetX = null;
		this.moveTargetZ = null;
	}

	/**
	 * Set a world-space movement target for tap-to-move controls.
	 * @param targetX
	 * Target X position.
	 * @param targetZ
	 * Target Z position.
	 */
	setMoveTarget(
		targetX: number,
		targetZ: number): void
	{
		this.moveTargetX = targetX;
		this.moveTargetZ = targetZ;
	}

	/**
	 * Per-frame update. Reads key state and applies movement.
	 * Called by GameLoopService each frame.
	 * @param keys
	 * Current keyboard state (key name -> pressed).
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	update(
		keys: Record<string, boolean>,
		deltaTime: number): void
	{
		if (this.spyNode == null)
		{
			return;
		}

		/* Process stun timer. */
		if (this.processStun(deltaTime))
		{
			return;
		}

		const hasDirectionalInput: boolean =
			keys["ArrowUp"] === true
				|| keys["w"] === true
				|| keys["ArrowDown"] === true
				|| keys["s"] === true
				|| keys["ArrowLeft"] === true
				|| keys["a"] === true
				|| keys["ArrowRight"] === true
				|| keys["d"] === true;

		if (hasDirectionalInput)
		{
			this.moveTargetX = null;
			this.moveTargetZ = null;
			this.applyCardinalMovement(keys, deltaTime);
		}
		else
		{
			this.applyMoveTarget(deltaTime);
		}

		this.clampToBounds();
	}

	/**
	 * Moves the player toward the active tap target when one is set.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private applyMoveTarget(deltaTime: number): void
	{
		if (
			this.spyNode == null
				|| this.moveTargetX == null
				|| this.moveTargetZ == null)
		{
			return;
		}

		const currentX: number =
			this.spyNode.position.x;
		const currentZ: number =
			this.spyNode.position.z;
		const deltaX: number =
			this.moveTargetX - currentX;
		const deltaZ: number =
			this.moveTargetZ - currentZ;
		const distance: number =
			distanceXZ(currentX, currentZ, this.moveTargetX, this.moveTargetZ);

		if (distance <= TAP_TARGET_REACHED_DISTANCE)
		{
			this.moveTargetX = null;
			this.moveTargetZ = null;
			return;
		}

		const directionX: number =
			deltaX / distance;
		const directionZ: number =
			deltaZ / distance;
		const maxStep: number =
			SPY_MOVE_SPEED * deltaTime;
		const stepDistance: number =
			Math.min(maxStep, distance);
		const moveX: number =
			directionX * stepDistance;
		const moveZ: number =
			directionZ * stepDistance;

		this.spyNode.rotation.y =
			Math.atan2(moveX, moveZ);

		const nextX: number =
			currentX + moveX;
		if (!this.collidesWithWall(nextX, currentZ))
		{
			this.spyNode.position.x = nextX;
		}

		const nextZ: number =
			currentZ + moveZ;
		if (!this.collidesWithWall(this.spyNode.position.x, nextZ))
		{
			this.spyNode.position.z = nextZ;
		}
	}

	/**
	 * Processes the stun timer countdown.
	 * @param deltaTime
	 * Frame delta in seconds.
	 * @returns
	 * True if still stunned (caller should skip movement).
	 */
	private processStun(deltaTime: number): boolean
	{
		if (this.stunRemaining <= 0)
		{
			return false;
		}

		this.stunRemaining =
			Math.max(0, this.stunRemaining - deltaTime);

		if (this.stunRemaining <= 0)
		{
			this.currentStunState =
				StunState.None;
		}

		return true;
	}

	/**
	 * Applies cardinal WASD/arrow movement with wall collision.
	 * W/Up = +Z (north), S/Down = -Z (south), A/Left = -X (west), D/Right = +X (east).
	 * The spy automatically faces the direction of movement.
	 * @param keys
	 * Pressed key map.
	 * @param deltaTime
	 * Frame delta in seconds.
	 */
	private applyCardinalMovement(
		keys: Record<string, boolean>,
		deltaTime: number): void
	{
		if (this.spyNode == null)
		{
			return;
		}

		const spyNode: TransformNode =
			this.spyNode;

		const { moveX, moveZ } =
			this.calculateInputVelocity(keys, deltaTime);

		if (moveX === 0 && moveZ === 0)
		{
			return;
		}

		/* Auto-face the direction of movement. */
		spyNode.rotation.y =
			Math.atan2(moveX, moveZ);

		/* Apply movement with wall collision (slide along walls). */
		const currentX: number =
			spyNode.position.x;
		const currentZ: number =
			spyNode.position.z;

		/* Try X-axis movement first. */
		const nextX: number =
			currentX + moveX;

		if (!this.collidesWithWall(nextX, currentZ))
		{
			spyNode.position.x = nextX;
		}

		/* Try Z-axis movement. */
		const nextZ: number =
			currentZ + moveZ;

		if (!this.collidesWithWall(spyNode.position.x, nextZ))
		{
			spyNode.position.z = nextZ;
		}
	}

	/**
	 * Calculates the movement velocity from keyboard input.
	 * @param keys
	 * Pressed key map.
	 * @param deltaTime
	 * Frame delta in seconds.
	 * @returns
	 * The X and Z movement deltas.
	 */
	private calculateInputVelocity(
		keys: Record<string, boolean>,
		deltaTime: number): { moveX: number; moveZ: number; }
	{
		let moveX: number = 0;
		let moveZ: number = 0;

		if (keys["ArrowUp"] === true || keys["w"] === true)
		{
			moveZ += SPY_MOVE_SPEED * deltaTime;
		}

		if (keys["ArrowDown"] === true || keys["s"] === true)
		{
			moveZ -= SPY_MOVE_SPEED * deltaTime;
		}

		if (keys["ArrowLeft"] === true || keys["a"] === true)
		{
			moveX -= SPY_MOVE_SPEED * deltaTime;
		}

		if (keys["ArrowRight"] === true || keys["d"] === true)
		{
			moveX += SPY_MOVE_SPEED * deltaTime;
		}

		return { moveX, moveZ };
	}

	/**
	 * Tests whether a circular spy at (x, z) collides with any wall AABB.
	 * Public to allow reuse by AI collision detection.
	 * @param x
	 * Candidate X position.
	 * @param z
	 * Candidate Z position.
	 * @returns True if position collides with a wall.
	 */
	collidesWithWall(
		x: number,
		z: number): boolean
	{
		for (const wall of this.wallAABBs)
		{
			const closestX: number =
				Math.max(wall.minX, Math.min(x, wall.maxX));
			const closestZ: number =
				Math.max(wall.minZ, Math.min(z, wall.maxZ));
			const distX: number =
				x - closestX;
			const distZ: number =
				z - closestZ;

			if (distX * distX + distZ * distZ < SPY_MESH_RADIUS * SPY_MESH_RADIUS)
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Builds wall AABBs from room definitions and doorway connections.
	 * @returns Array of wall AABBs for collision detection.
	 */
	private buildWallAABBs(): WallAABB[]
	{
		const walls: WallAABB[] = [];

		for (const room of ISLAND_ROOMS)
		{
			const connectedRooms: RoomDefinition[] =
				room
					.connections
					.map((connId) =>
						ISLAND_ROOMS.find((room) => room.id === connId))
					.filter((room): room is RoomDefinition =>
						room !== undefined);

			this.addRoomWalls(walls, room, connectedRooms);
		}

		return walls;
	}

	/**
	 * Adds wall AABBs for a room's four cardinal walls with doorway gaps.
	 * @param walls
	 * Accumulating wall array.
	 * @param room
	 * The room definition.
	 * @param connectedRooms
	 * Rooms connected to this room.
	 */
	private addRoomWalls(
		walls: WallAABB[],
		room: RoomDefinition,
		connectedRooms: ReadonlyArray<RoomDefinition>): void
	{
		const halfW: number =
			WALL_THICKNESS / 2;

		/* Check if the airstrip zone is directly south of this room. */
		const southWallZ: number =
			room.centerZ + room.halfDepth;
		const airstripExitsSouth: boolean =
			Math.abs(room.centerX - AIRSTRIP_CENTER_X) <= room.halfWidth
				&& AIRSTRIP_CENTER_Z > southWallZ;

		this.addCardinalWall(
			{
				walls,
				room,
				connectedRooms,
				halfW,
				hasDoorwayPredicate: (connectedRoom) =>
					connectedRoom.centerZ < room.centerZ,
				isHorizontal: true,
				wallEdge: room.centerZ - room.halfDepth
			});

		this.addCardinalWall(
			{
				walls,
				room,
				connectedRooms,
				halfW,
				hasDoorwayPredicate: (connectedRoom) =>
					connectedRoom.centerZ > room.centerZ,
				isHorizontal: true,
				wallEdge: southWallZ,
				hasExternalExit: airstripExitsSouth
			});

		this.addCardinalWall(
			{
				walls,
				room,
				connectedRooms,
				halfW,
				hasDoorwayPredicate: (connectedRoom) =>
					connectedRoom.centerX < room.centerX,
				isHorizontal: false,
				wallEdge: room.centerX - room.halfWidth
			});

		this.addCardinalWall(
			{
				walls,
				room,
				connectedRooms,
				halfW,
				hasDoorwayPredicate: (connectedRoom) =>
					connectedRoom.centerX > room.centerX,
				isHorizontal: false,
				wallEdge: room.centerX + room.halfWidth
			});
	}

	/**
	 * Adds a single cardinal wall AABB with optional doorway gap.
	 * @param params
	 * Cardinal wall creation parameters.
	 */
	private addCardinalWall(params: CardinalWallParams): void
	{
		const { walls, room, connectedRooms, halfW, hasDoorwayPredicate, isHorizontal, wallEdge } = params;
		const hasDoorway: boolean =
			connectedRooms.some(hasDoorwayPredicate)
				|| params.hasExternalExit === true;

		if (isHorizontal)
		{
			this.addWallSegments(
				{
					walls,
					minX: room.centerX - room.halfWidth,
					maxX: room.centerX + room.halfWidth,
					minZ: wallEdge - halfW,
					maxZ: wallEdge + halfW,
					hasDoorway,
					isHorizontal: true,
					doorwayCenter: room.centerX
				});
		}
		else
		{
			this.addWallSegments(
				{
					walls,
					minX: wallEdge - halfW,
					maxX: wallEdge + halfW,
					minZ: room.centerZ - room.halfDepth,
					maxZ: room.centerZ + room.halfDepth,
					hasDoorway,
					isHorizontal: false,
					doorwayCenter: room.centerZ
				});
		}
	}

	/**
	 * Adds wall segment(s) with optional doorway gap.
	 * @param params
	 * Wall segment creation parameters.
	 */
	private addWallSegments(params: WallSegmentParams): void
	{
		const { walls, minX, maxX, minZ, maxZ, hasDoorway, isHorizontal, doorwayCenter } = params;
		if (!hasDoorway)
		{
			walls.push(
				{ minX, maxX, minZ, maxZ });
			return;
		}

		const halfDoor: number =
			DOORWAY_WIDTH / 2;

		if (isHorizontal)
		{
			/* Left segment. */
			walls.push(
				{
					minX,
					maxX: doorwayCenter - halfDoor,
					minZ,
					maxZ
				});

			/* Right segment. */
			walls.push(
				{
					minX: doorwayCenter + halfDoor,
					maxX,
					minZ,
					maxZ
				});
		}
		else
		{
			/* Top segment. */
			walls.push(
				{
					minX,
					maxX,
					minZ,
					maxZ: doorwayCenter - halfDoor
				});

			/* Bottom segment. */
			walls.push(
				{
					minX,
					maxX,
					minZ: doorwayCenter + halfDoor,
					maxZ
				});
		}
	}

	/**
	 * Clamps the spy position to the island boundaries.
	 */
	private clampToBounds(): void
	{
		if (this.spyNode == null)
		{
			return;
		}

		this.spyNode.position.x =
			Math.max(
				-HALF_ISLAND,
				Math.min(HALF_ISLAND, this.spyNode.position.x));
		this.spyNode.position.z =
			Math.max(
				-HALF_ISLAND,
				Math.min(HALF_ISLAND, this.spyNode.position.z));
	}

	/**
	 * Applies a stun effect, preventing movement for the given duration.
	 * @param stun
	 * The type of stun to apply.
	 * @param durationSeconds
	 * How long the stun lasts.
	 */
	setStunned(
		stun: StunState,
		durationSeconds: number): void
	{
		this.currentStunState = stun;
		this.stunRemaining = durationSeconds;
	}

	/**
	 * Returns current spy state snapshot.
	 * @returns
	 * Read-only state containing position, rotation, and stun info.
	 */
	getState(): SpyPhysicsState
	{
		return {
			positionX: this.spyNode?.position.x ?? 0,
			positionZ: this.spyNode?.position.z ?? 0,
			rotationY: this.spyNode?.rotation.y ?? 0,
			stunState: this.currentStunState,
			stunRemainingSeconds: this.stunRemaining
		};
	}

	/**
	 * Resets the spy to its spawn position and clears stun state.
	 * Used on game restart without full dispose/reinitialize.
	 * @param spawnX
	 * Initial X position.
	 * @param spawnZ
	 * Initial Z position.
	 */
	resetPosition(
		spawnX: number,
		spawnZ: number): void
	{
		if (this.spyNode != null)
		{
			this.spyNode.position.x = spawnX;
			this.spyNode.position.z = spawnZ;
			this.spyNode.rotation.y = 0;
			this.moveTargetX = null;
			this.moveTargetZ = null;
		}

		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
	}

	/**
	 * Resets physics state to initial values without unbinding from the scene node.
	 * Clears stun state and move targets.
	 */
	reset(): void
	{
		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
		this.moveTargetX = null;
		this.moveTargetZ = null;
	}

	/**
	 * Disposes internal state and unbinds from scene node.
	 */
	dispose(): void
	{
		this.spyNode = null;
		this.currentStunState =
			StunState.None;
		this.stunRemaining = 0;
		this.wallAABBs = [];
	}
}