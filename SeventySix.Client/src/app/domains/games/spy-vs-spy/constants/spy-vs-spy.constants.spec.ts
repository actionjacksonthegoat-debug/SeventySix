// <copyright file="spy-vs-spy.constants.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy vs Spy constants type and value tests.
 * Pure TypeScript assertions — no TestBed required.
 */

import {
	AI_DECISION_INTERVAL_SECONDS,
	AI_TRAP_PROBABILITY,
	BLACK_SPY_SPAWN_X,
	BLACK_SPY_SPAWN_Z,
	BOMB_STUN_SECONDS,
	CAMERA_HEIGHT,
	CAMERA_PITCH_DEGREES,
	COMBAT_DURATION_SECONDS,
	COMBAT_ENGAGE_RADIUS,
	COMBAT_RADIUS,
	CORRIDOR_WIDTH,
	COUNTDOWN_DURATION_SECONDS,
	DEATH_ANIMATION_SECONDS,
	DEATH_TIMER_PENALTY_SECONDS,
	DOORWAY_WIDTH,
	EXPLOSION_DURATION_SECONDS,
	FURNITURE_SEARCH_RADIUS,
	GAME_TIMER_SECONDS,
	INITIAL_TRAP_COUNT_PER_TYPE,
	ISLAND_ROOMS,
	ISLAND_SIZE,
	ITEM_COLLECTION_RADIUS,
	MAX_REMEDIES_IN_WORLD,
	OUTSIDE_AREA_DEPTH,
	OUTSIDE_TREE_COUNT,
	REMEDY_DEFUSES,
	REQUIRED_ITEM_COUNT,
	ROOM_FURNITURE,
	SPRING_STUN_SECONDS,
	SPY_MESH_HEIGHT,
	SPY_MESH_RADIUS,
	SPY_MOVE_SPEED,
	SPY_ROTATION_SPEED,
	TRAP_TRIGGER_RADIUS,
	WHITE_SPY_SPAWN_X,
	WHITE_SPY_SPAWN_Z
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import type { RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { ItemType, RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";

describe("spy-vs-spy physics constants",
	() =>
	{
		it("SPY_MOVE_SPEED should be a positive number",
			() =>
			{
				expect(typeof SPY_MOVE_SPEED)
					.toBe("number");
				expect(SPY_MOVE_SPEED)
					.toBeGreaterThan(0);
			});

		it("SPY_ROTATION_SPEED should be a positive number",
			() =>
			{
				expect(typeof SPY_ROTATION_SPEED)
					.toBe("number");
				expect(SPY_ROTATION_SPEED)
					.toBeGreaterThan(0);
			});

		it("ITEM_COLLECTION_RADIUS should be a positive number",
			() =>
			{
				expect(ITEM_COLLECTION_RADIUS)
					.toBeGreaterThan(0);
			});

		it("TRAP_TRIGGER_RADIUS should be less than ITEM_COLLECTION_RADIUS",
			() =>
			{
				expect(TRAP_TRIGGER_RADIUS)
					.toBeLessThan(ITEM_COLLECTION_RADIUS);
			});

		it("COMBAT_RADIUS should be a positive number",
			() =>
			{
				expect(COMBAT_RADIUS)
					.toBeGreaterThan(0);
			});
	});

describe("spy-vs-spy timing constants",
	() =>
	{
		it("COUNTDOWN_DURATION_SECONDS should be 3",
			() =>
			{
				expect(COUNTDOWN_DURATION_SECONDS)
					.toBe(3);
			});

		it("BOMB_STUN_SECONDS should be positive",
			() =>
			{
				expect(BOMB_STUN_SECONDS)
					.toBeGreaterThan(0);
			});

		it("SPRING_STUN_SECONDS should be positive",
			() =>
			{
				expect(SPRING_STUN_SECONDS)
					.toBeGreaterThan(0);
			});

		it("AI_DECISION_INTERVAL_SECONDS should be positive",
			() =>
			{
				expect(AI_DECISION_INTERVAL_SECONDS)
					.toBeGreaterThan(0);
			});

		it("AI_TRAP_PROBABILITY should be between 0 and 1",
			() =>
			{
				expect(AI_TRAP_PROBABILITY)
					.toBeGreaterThanOrEqual(0);
				expect(AI_TRAP_PROBABILITY)
					.toBeLessThanOrEqual(1);
			});
	});

describe("spy-vs-spy camera constants",
	() =>
	{
		it("CAMERA_HEIGHT should be a positive number",
			() =>
			{
				expect(CAMERA_HEIGHT)
					.toBeGreaterThan(0);
			});

		it("CAMERA_PITCH_DEGREES should be between 0 and 90",
			() =>
			{
				expect(CAMERA_PITCH_DEGREES)
					.toBeGreaterThan(0);
				expect(CAMERA_PITCH_DEGREES)
					.toBeLessThanOrEqual(90);
			});
	});

describe("spy-vs-spy island geometry constants",
	() =>
	{
		it("ISLAND_SIZE should be positive",
			() =>
			{
				expect(ISLAND_SIZE)
					.toBeGreaterThan(0);
			});

		it("CORRIDOR_WIDTH should be positive",
			() =>
			{
				expect(CORRIDOR_WIDTH)
					.toBeGreaterThan(0);
			});

		it("SPY_MESH_HEIGHT should be positive",
			() =>
			{
				expect(SPY_MESH_HEIGHT)
					.toBeGreaterThan(0);
			});

		it("SPY_MESH_RADIUS should be positive",
			() =>
			{
				expect(SPY_MESH_RADIUS)
					.toBeGreaterThan(0);
			});
	});

describe("REQUIRED_ITEM_COUNT",
	() =>
	{
		it("should be 4 (one per ItemType member)",
			() =>
			{
				expect(REQUIRED_ITEM_COUNT)
					.toBe(4);
				expect(REQUIRED_ITEM_COUNT)
					.toBe(Object.values(ItemType).length);
			});
	});

describe("ISLAND_ROOMS",
	() =>
	{
		it("should have 6 rooms (one per RoomId member)",
			() =>
			{
				expect(ISLAND_ROOMS.length)
					.toBe(6);
				expect(ISLAND_ROOMS.length)
					.toBe(Object.values(RoomId).length);
			});

		it("all room IDs should be unique",
			() =>
			{
				const ids: string[] =
					ISLAND_ROOMS.map((room) => room.id);
				const uniqueIds: Set<string> =
					new Set(ids);
				expect(uniqueIds.size)
					.toBe(ids.length);
			});

		it("all connections should be bidirectional (symmetric)",
			() =>
			{
				for (const room of ISLAND_ROOMS)
				{
					for (const connectedId of room.connections)
					{
						const connectedRoom: RoomDefinition | undefined =
							ISLAND_ROOMS.find((room) => room.id === connectedId);
						expect(connectedRoom)
							.toBeDefined();
						expect(connectedRoom?.connections)
							.toContain(room.id);
					}
				}
			});

		it("Library room should have no spawnable items",
			() =>
			{
				const library: RoomDefinition | undefined =
					ISLAND_ROOMS.find((room) => room.id === RoomId.Library);
				expect(library?.spawnableItems.length)
					.toBe(0);
			});

		it("each required ItemType has at least one room that can spawn it (excluding Library)",
			() =>
			{
				const nonLibrary: RoomDefinition[] =
					ISLAND_ROOMS.filter((room) => room.id !== RoomId.Library);
				for (const itemType of Object.values(ItemType))
				{
					const roomWithItem: RoomDefinition | undefined =
						nonLibrary.find(
							(room) =>
							{
								return room.spawnableItems.includes(itemType);
							});
					expect(roomWithItem, `ItemType.${itemType} must have at least one spawnable room`)
						.toBeDefined();
				}
			});

		it("all rooms should have positive half-extents",
			() =>
			{
				for (const room of ISLAND_ROOMS)
				{
					expect(room.halfWidth, `${room.id} halfWidth`)
						.toBeGreaterThan(0);
					expect(room.halfDepth, `${room.id} halfDepth`)
						.toBeGreaterThan(0);
				}
			});
	});

describe("spy spawn positions",
	() =>
	{
		it("BLACK_SPY_SPAWN_X should match Beach Shack center",
			() =>
			{
				const beachShack: RoomDefinition | undefined =
					ISLAND_ROOMS.find((room) => room.id === RoomId.BeachShack);
				expect(BLACK_SPY_SPAWN_X)
					.toBe(beachShack?.centerX);
			});

		it("BLACK_SPY_SPAWN_Z should match Beach Shack center",
			() =>
			{
				const beachShack: RoomDefinition | undefined =
					ISLAND_ROOMS.find((room) => room.id === RoomId.BeachShack);
				expect(BLACK_SPY_SPAWN_Z)
					.toBe(beachShack?.centerZ);
			});

		it("WHITE_SPY_SPAWN_X should match Watchtower center",
			() =>
			{
				const watchtower: RoomDefinition | undefined =
					ISLAND_ROOMS.find((room) => room.id === RoomId.Watchtower);
				expect(WHITE_SPY_SPAWN_X)
					.toBe(watchtower?.centerX);
			});

		it("WHITE_SPY_SPAWN_Z should match Watchtower center",
			() =>
			{
				const watchtower: RoomDefinition | undefined =
					ISLAND_ROOMS.find((room) => room.id === RoomId.Watchtower);
				expect(WHITE_SPY_SPAWN_Z)
					.toBe(watchtower?.centerZ);
			});
	});

describe("doorway constants",
	() =>
	{
		it("DOORWAY_WIDTH should be positive and less than room half-width",
			() =>
			{
				expect(DOORWAY_WIDTH)
					.toBeGreaterThan(0);
				expect(DOORWAY_WIDTH)
					.toBeLessThan(ISLAND_ROOMS[0].halfWidth);
			});
	});

describe("furniture constants",
	() =>
	{
		it("FURNITURE_SEARCH_RADIUS should be positive",
			() =>
			{
				expect(FURNITURE_SEARCH_RADIUS)
					.toBeGreaterThan(0);
			});

		it("ROOM_FURNITURE should have entries for all 6 rooms",
			() =>
			{
				const roomIds: Set<string> =
					new Set(ROOM_FURNITURE.map((furniture) => furniture.roomId));
				for (const roomId of Object.values(RoomId))
				{
					expect(roomIds.has(roomId), `Room ${roomId} should have furniture`)
						.toBe(true);
				}
			});

		it("ROOM_FURNITURE IDs should be unique",
			() =>
			{
				const ids: string[] =
					ROOM_FURNITURE.map((furniture) => furniture.id);
				const unique: Set<string> =
					new Set(ids);
				expect(unique.size)
					.toBe(ids.length);
			});
	});

describe("timer constants",
	() =>
	{
		it("GAME_TIMER_SECONDS should be 360",
			() =>
			{
				expect(GAME_TIMER_SECONDS)
					.toBe(360);
			});

		it("DEATH_TIMER_PENALTY_SECONDS should be 15",
			() =>
			{
				expect(DEATH_TIMER_PENALTY_SECONDS)
					.toBe(15);
			});

		it("EXPLOSION_DURATION_SECONDS should be positive",
			() =>
			{
				expect(EXPLOSION_DURATION_SECONDS)
					.toBeGreaterThan(0);
			});
	});

describe("combat constants",
	() =>
	{
		it("COMBAT_ENGAGE_RADIUS should be positive",
			() =>
			{
				expect(COMBAT_ENGAGE_RADIUS)
					.toBeGreaterThan(0);
			});

		it("COMBAT_DURATION_SECONDS should be positive",
			() =>
			{
				expect(COMBAT_DURATION_SECONDS)
					.toBeGreaterThan(0);
			});

		it("DEATH_ANIMATION_SECONDS should be positive",
			() =>
			{
				expect(DEATH_ANIMATION_SECONDS)
					.toBeGreaterThan(0);
			});
	});

describe("remedy constants",
	() =>
	{
		it("REMEDY_DEFUSES should have 2 entries",
			() =>
			{
				expect(REMEDY_DEFUSES.length)
					.toBe(2);
			});

		it("INITIAL_TRAP_COUNT_PER_TYPE should be positive",
			() =>
			{
				expect(INITIAL_TRAP_COUNT_PER_TYPE)
					.toBeGreaterThan(0);
			});

		it("MAX_REMEDIES_IN_WORLD should be positive",
			() =>
			{
				expect(MAX_REMEDIES_IN_WORLD)
					.toBeGreaterThan(0);
			});
	});

describe("outside area constants",
	() =>
	{
		it("OUTSIDE_AREA_DEPTH should be positive",
			() =>
			{
				expect(OUTSIDE_AREA_DEPTH)
					.toBeGreaterThan(0);
			});

		it("OUTSIDE_TREE_COUNT should be positive",
			() =>
			{
				expect(OUTSIDE_TREE_COUNT)
					.toBeGreaterThan(0);
			});
	});