// <copyright file="spy-pathfinding.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Pathfinding Service.
 * Handles navigation, waypoint planning, and movement for the AI spy.
 * Single Responsibility: pathfinding and spatial reasoning across the island room graph.
 * Rule-based navigation (no pathfinding library) — appropriate for grid room layout.
 */

import { inject, Injectable } from "@angular/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import {
	AI_SPEED_MULTIPLIER,
	ISLAND_ROOMS,
	ISLAND_SIZE,
	SPY_MOVE_SPEED
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyPhysicsService } from "@games/spy-vs-spy/services/spy-physics.service";

/** Half the island size for boundary clamping. */
const HALF_ISLAND: number =
	ISLAND_SIZE / 2;

/** Distance threshold for considering goal reached. */
const GOAL_REACHED_DISTANCE: number = 1.5;

/** Offset past the wall center so waypoints are through the doorway, not on the wall. */
const DOORWAY_WAYPOINT_OFFSET: number = 2.0;

/**
 * Spy Pathfinding Service.
 * Owns navigation state (goal, waypoints) and moves the AI spy toward destinations.
 * Uses BFS through room connections for multi-room doorway waypoint planning.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyPathfindingService
{
	/** Physics service for wall collision detection. */
	private readonly physicsService: SpyPhysicsService =
		inject(SpyPhysicsService);

	/** Current goal position (X). */
	private goalX: number = 0;

	/** Current goal position (Z). */
	private goalZ: number = 0;

	/** Intermediate doorway waypoint X (used when navigating between rooms). */
	private waypointX: number | null = null;

	/** Intermediate doorway waypoint Z (used when navigating between rooms). */
	private waypointZ: number | null = null;

	/**
	 * Sets the navigation goal position.
	 * @param posX
	 * Target X coordinate.
	 * @param posZ
	 * Target Z coordinate.
	 */
	setGoal(
		posX: number,
		posZ: number): void
	{
		this.goalX = posX;
		this.goalZ = posZ;
	}

	/**
	 * Returns the current goal position.
	 * @returns
	 * Read-only goal coordinates.
	 */
	getGoal(): { readonly x: number; readonly z: number; }
	{
		return { x: this.goalX, z: this.goalZ };
	}

	/**
	 * Clears any active doorway waypoint.
	 */
	clearWaypoint(): void
	{
		this.waypointX = null;
		this.waypointZ = null;
	}

	/**
	 * Moves the AI node toward its current goal position with wall collision.
	 * Uses doorway waypoints when the goal is in a different room.
	 * @param aiNode
	 * The TransformNode representing the AI spy.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	moveTowardGoal(
		aiNode: TransformNode,
		deltaTime: number): void
	{
		const target: { x: number; z: number; } =
			this.resolveNavigationTarget(aiNode);

		this.planNavigationWaypoint(aiNode, target);

		const effectiveX: number =
			this.waypointX ?? target.x;
		const effectiveZ: number =
			this.waypointZ ?? target.z;

		this.applyMovementTowardTarget(aiNode, effectiveX, effectiveZ, deltaTime);
	}

	/**
	 * Determines which room contains the given position.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @returns
	 * The RoomId of the room containing the position, or nearest room as fallback.
	 */
	determineCurrentRoom(
		posX: number,
		posZ: number): RoomId
	{
		for (const room of ISLAND_ROOMS)
		{
			if (
				Math.abs(posX - room.centerX) <= room.halfWidth
					&& Math.abs(posZ - room.centerZ) <= room.halfDepth)
			{
				return room.id;
			}
		}

		return this.findNearestRoomToPosition(posX, posZ);
	}

	/**
	 * Determines which room contains the given world position.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @returns
	 * The RoomId of the containing room, or nearest room as fallback.
	 */
	determineRoomForPosition(
		posX: number,
		posZ: number): RoomId
	{
		for (const room of ISLAND_ROOMS)
		{
			if (
				Math.abs(posX - room.centerX) <= room.halfWidth
					&& Math.abs(posZ - room.centerZ) <= room.halfDepth)
			{
				return room.id;
			}
		}

		return this.findNearestRoomToPosition(posX, posZ);
	}

	/**
	 * Finds the room whose center is nearest to the given position.
	 * @param posX
	 * World X position.
	 * @param posZ
	 * World Z position.
	 * @returns
	 * The RoomId of the nearest room by Euclidean distance.
	 */
	findNearestRoomToPosition(
		posX: number,
		posZ: number): RoomId
	{
		let nearestId: RoomId =
			RoomId.Library;
		let nearestDistSq: number =
			Number.MAX_VALUE;

		for (const room of ISLAND_ROOMS)
		{
			const distSq: number =
				(posX - room.centerX) ** 2
					+ (posZ - room.centerZ) ** 2;

			if (distSq < nearestDistSq)
			{
				nearestDistSq = distSq;
				nearestId =
					room.id;
			}
		}

		return nearestId;
	}

	/**
	 * Finds the doorway position between two rooms using BFS through connections.
	 * @param fromRoomId
	 * The room the AI is currently in.
	 * @param toRoomId
	 * The room the AI wants to reach.
	 * @returns
	 * The doorway center coordinates, or null if no path exists.
	 */
	findDoorwayBetweenRooms(
		fromRoomId: RoomId,
		toRoomId: RoomId): { readonly x: number; readonly z: number; } | null
	{
		const fromRoom: RoomDefinition | undefined =
			ISLAND_ROOMS.find(
				(room) => room.id === fromRoomId);

		if (fromRoom == null)
		{
			return null;
		}

		/* Direct connection — doorway is at the shared wall center. */
		if (fromRoom.connections.includes(toRoomId))
		{
			return this.getDoorwayPosition(fromRoom, toRoomId);
		}

		/* BFS for multi-hop path — find first step toward destination. */
		const visited: Set<RoomId> =
			new Set<RoomId>(
				[fromRoomId]);
		const queue: Array<{ readonly roomId: RoomId; readonly firstStep: RoomId; }> =
			fromRoom.connections.map(
				(connId) => ({ roomId: connId, firstStep: connId }));

		for (const entry of queue)
		{
			visited.add(entry.roomId);
		}

		for (const entry of queue)
		{
			if (entry.roomId === toRoomId)
			{
				return this.getDoorwayPosition(fromRoom, entry.firstStep);
			}

			const nextRoom: RoomDefinition | undefined =
				ISLAND_ROOMS.find(
					(room) => room.id === entry.roomId);

			if (nextRoom == null)
			{
				continue;
			}

			for (const neighborId of nextRoom.connections)
			{
				if (!visited.has(neighborId))
				{
					visited.add(neighborId);
					queue.push(
						{ roomId: neighborId, firstStep: entry.firstStep });
				}
			}
		}

		return null;
	}

	/**
	 * Resets navigation state to the given spawn position.
	 * @param spawnX
	 * Spawn X coordinate.
	 * @param spawnZ
	 * Spawn Z coordinate.
	 */
	reset(
		spawnX: number,
		spawnZ: number): void
	{
		this.goalX = spawnX;
		this.goalZ = spawnZ;
		this.waypointX = null;
		this.waypointZ = null;
	}

	/**
	 * Resolves the effective navigation target, clearing reached waypoints.
	 * @param aiNode
	 * The TransformNode representing the AI spy.
	 * @returns
	 * The current target coordinates.
	 */
	private resolveNavigationTarget(
		aiNode: TransformNode): { x: number; z: number; }
	{
		const currentX: number =
			aiNode.position.x;
		const currentZ: number =
			aiNode.position.z;

		if (this.waypointX != null && this.waypointZ != null)
		{
			const waypointDeltaX: number =
				this.waypointX - currentX;
			const waypointDeltaZ: number =
				this.waypointZ - currentZ;

			if (
				waypointDeltaX * waypointDeltaX + waypointDeltaZ * waypointDeltaZ
					<= GOAL_REACHED_DISTANCE * GOAL_REACHED_DISTANCE)
			{
				this.waypointX = null;
				this.waypointZ = null;
			}
		}

		return { x: this.goalX, z: this.goalZ };
	}

	/**
	 * Plans a doorway waypoint when the goal is in a different room.
	 * @param aiNode
	 * The TransformNode representing the AI spy.
	 * @param target
	 * The final goal coordinates.
	 */
	private planNavigationWaypoint(
		aiNode: TransformNode,
		target: { readonly x: number; readonly z: number; }): void
	{
		if (this.waypointX != null)
		{
			return;
		}

		const currentX: number =
			aiNode.position.x;
		const currentZ: number =
			aiNode.position.z;
		const currentRoom: RoomId =
			this.determineCurrentRoom(currentX, currentZ);

		const goalInRoom: boolean =
			ISLAND_ROOMS.some((room) =>
				Math.abs(target.x - room.centerX) <= room.halfWidth
					&& Math.abs(target.z - room.centerZ) <= room.halfDepth);
		const aiInRoom: boolean =
			ISLAND_ROOMS.some((room) =>
				Math.abs(currentX - room.centerX) <= room.halfWidth
					&& Math.abs(currentZ - room.centerZ) <= room.halfDepth);

		if (!goalInRoom && !aiInRoom)
		{
			return;
		}

		const targetRoom: RoomId =
			goalInRoom
				? this.determineRoomForPosition(target.x, target.z)
				: this.findNearestRoomToPosition(target.x, target.z);

		if (currentRoom === targetRoom)
		{
			return;
		}

		const doorway: { readonly x: number; readonly z: number; } | null =
			this.findDoorwayBetweenRooms(
				currentRoom,
				targetRoom);

		if (doorway != null)
		{
			this.waypointX =
				doorway.x;
			this.waypointZ =
				doorway.z;
		}
	}

	/**
	 * Applies movement toward a target with wall collision and boundary clamping.
	 * @param aiNode
	 * The TransformNode representing the AI spy.
	 * @param targetX
	 * Target X coordinate.
	 * @param targetZ
	 * Target Z coordinate.
	 * @param deltaTime
	 * Frame delta time in seconds.
	 */
	private applyMovementTowardTarget(
		aiNode: TransformNode,
		targetX: number,
		targetZ: number,
		deltaTime: number): void
	{
		const currentX: number =
			aiNode.position.x;
		const currentZ: number =
			aiNode.position.z;
		const directionX: number =
			targetX - currentX;
		const directionZ: number =
			targetZ - currentZ;
		const distance: number =
			Math.sqrt(
				directionX * directionX
					+ directionZ * directionZ);

		if (distance <= GOAL_REACHED_DISTANCE)
		{
			return;
		}

		const normalizedX: number =
			directionX / distance;
		const normalizedZ: number =
			directionZ / distance;
		const moveAmount: number =
			SPY_MOVE_SPEED * AI_SPEED_MULTIPLIER * deltaTime;

		const nextX: number =
			currentX + normalizedX * moveAmount;

		if (!this.physicsService.collidesWithWall(nextX, currentZ))
		{
			aiNode.position.x = nextX;
		}

		const nextZ: number =
			currentZ + normalizedZ * moveAmount;

		if (!this.physicsService.collidesWithWall(aiNode.position.x, nextZ))
		{
			aiNode.position.z = nextZ;
		}

		aiNode.position.x =
			Math.max(
				-HALF_ISLAND,
				Math.min(HALF_ISLAND, aiNode.position.x));
		aiNode.position.z =
			Math.max(
				-HALF_ISLAND,
				Math.min(HALF_ISLAND, aiNode.position.z));

		aiNode.rotation.y =
			Math.atan2(normalizedX, normalizedZ);
	}

	/**
	 * Calculates the doorway position between a room and a connected room.
	 * The doorway is centered on the shared wall between the two rooms.
	 * @param fromRoom
	 * The room definition to navigate from.
	 * @param toRoomId
	 * The connected room to navigate toward.
	 * @returns
	 * The doorway center coordinates, or null if not connected.
	 */
	private getDoorwayPosition(
		fromRoom: RoomDefinition,
		toRoomId: RoomId): { readonly x: number; readonly z: number; } | null
	{
		const toRoom: RoomDefinition | undefined =
			ISLAND_ROOMS.find(
				(room) => room.id === toRoomId);

		if (toRoom == null)
		{
			return null;
		}

		/* Determine shared wall direction based on relative position. */
		if (toRoom.centerZ < fromRoom.centerZ)
		{
			/* Door is on north wall — offset northward through doorway. */
			return { x: fromRoom.centerX, z: fromRoom.centerZ - fromRoom.halfDepth - DOORWAY_WAYPOINT_OFFSET };
		}

		if (toRoom.centerZ > fromRoom.centerZ)
		{
			/* Door is on south wall — offset southward through doorway. */
			return { x: fromRoom.centerX, z: fromRoom.centerZ + fromRoom.halfDepth + DOORWAY_WAYPOINT_OFFSET };
		}

		if (toRoom.centerX < fromRoom.centerX)
		{
			/* Door is on west wall — offset westward through doorway. */
			return { x: fromRoom.centerX - fromRoom.halfWidth - DOORWAY_WAYPOINT_OFFSET, z: fromRoom.centerZ };
		}

		/* Door is on east wall — offset eastward through doorway. */
		return { x: fromRoom.centerX + fromRoom.halfWidth + DOORWAY_WAYPOINT_OFFSET, z: fromRoom.centerZ };
	}
}