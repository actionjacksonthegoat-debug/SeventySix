// <copyright file="spy-vs-spy.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy vs Spy Island game constants.
 * Physics, layout, timing, and behavioral tuning values.
 */

import { ItemType, RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { FurnitureDefinition, RemedyItem, RoomDefinition } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { FurnitureType, RemedyType, TrapType } from "@games/spy-vs-spy/models/spy-vs-spy.models";

// ─── Physics ───────────────────────────────────────────────────────────────

/** Spy movement speed in world units per second. */
export const SPY_MOVE_SPEED: number = 8;

/** Spy rotation speed in radians per second. */
export const SPY_ROTATION_SPEED: number = 4;

/** Distance within which a spy can collect an item. */
export const ITEM_COLLECTION_RADIUS: number = 1.5;

/** Distance within which a spy can trigger a trap. */
export const TRAP_TRIGGER_RADIUS: number = 1.2;

/** Distance within which spies are considered in direct combat. */
export const COMBAT_RADIUS: number = 1.8;

// ─── Lives ─────────────────────────────────────────────────────────────────

/** Starting lives for each spy. Losing all lives causes auto-loss. */
export const SPY_STARTING_LIVES: number = 3;

// ─── Timing ────────────────────────────────────────────────────────────────

/** Countdown duration before gameplay begins (seconds). */
export const COUNTDOWN_DURATION_SECONDS: number = 3;

/** Bomb stun duration (seconds). */
export const BOMB_STUN_SECONDS: number = 3;

/** Spring trap stun duration (seconds). */
export const SPRING_STUN_SECONDS: number = 2;

/** AI decision interval — how often AI re-evaluates its goal (seconds). */
export const AI_DECISION_INTERVAL_SECONDS: number = 0.8;

/** Minimum seconds between AI furniture searches. */
export const AI_SEARCH_COOLDOWN_SECONDS: number = 5;

/** AI movement speed multiplier relative to player speed (1.0 = same as player). */
export const AI_SPEED_MULTIPLIER: number = 1.0;

/** Probability (0–1) AI wanders randomly instead of searching optimally. */
export const AI_WANDER_PROBABILITY: number = 0.15;

/** Probability (0–1) AI places a trap when entering a room. */
export const AI_TRAP_PROBABILITY: number = 0.10;

/** Maximum number of recently visited rooms tracked for anti-clustering. */
export const AI_RECENT_ROOM_BUFFER_SIZE: number = 3;

/** Probability (0–1) AI intercepts player when in same or adjacent room. */
export const AI_INTERCEPT_PROBABILITY: number = 0.30;

/** Probability (0–1) AI places a trap when in the same room as the player. */
export const AI_SAME_ROOM_TRAP_PROBABILITY: number = 0.40;

/** Duration (milliseconds) the "Searching..." overlay stays visible. */
export const SEARCH_DISPLAY_MS: number = 600;

// ─── Camera ────────────────────────────────────────────────────────────────

/** Camera radius (distance from target) in world units. */
export const CAMERA_HEIGHT: number = 13;

/** Camera pitch angle in degrees for ArcRotateCamera beta (0 = top-down, 90 = horizon). */
export const CAMERA_PITCH_DEGREES: number = 45;

/** Vertical offset applied to the camera target point (world units up from ground). */
export const CAMERA_TARGET_Y_OFFSET: number = 2;

// ─── Island Geometry ───────────────────────────────────────────────────────

/** Island ground size (square, world units). */
export const ISLAND_SIZE: number = 80;

/** Island ground Y position (flat at sea level). */
export const ISLAND_GROUND_Y: number = 0;

/** Number of perimeter points for the island polygon. */
export const ISLAND_PERIMETER_POINTS: number = 64;

/** Base radius of the island (must encompass all rooms + airstrip). */
export const ISLAND_BASE_RADIUS: number = 52;

/** Maximum radial perturbation for natural shape. */
export const ISLAND_SHAPE_VARIATION: number = 5;

/** Wall height for room boundary meshes. */
export const ROOM_WALL_HEIGHT: number = 2;

/** Corridor width between connected rooms. */
export const CORRIDOR_WIDTH: number = 4;

/** Water plane size surrounding the island. */
export const WATER_PLANE_SIZE: number = 300;

// ─── Spy Mesh ──────────────────────────────────────────────────────────────

/** Half-height of the spy capsule mesh. */
export const SPY_MESH_HEIGHT: number = 2.2;

/** Radius of the spy capsule mesh. */
export const SPY_MESH_RADIUS: number = 0.5;

/** Y offset so spy mesh sits on the ground plane. */
export const SPY_GROUND_OFFSET: number = 1.1;

// ─── Island Map Layout ─────────────────────────────────────────────────────

/**
 * Island room definitions (world layout).
 * Grid arrangement: 2 rows × 3 columns.
 * Row 0 (north): BeachShack | JungleHQ | Watchtower
 * Row 1 (south): CoveCave   | Compound  | Library
 */
export const ISLAND_ROOMS: ReadonlyArray<RoomDefinition> =
	[
		{
			id: RoomId.BeachShack,
			displayName: "Beach Shack",
			centerX: -28,
			centerZ: -20,
			halfWidth: 10,
			halfDepth: 10,
			connections: [RoomId.JungleHQ, RoomId.CoveCave],
			spawnableItems: [ItemType.MoneyBag]
		},
		{
			id: RoomId.JungleHQ,
			displayName: "Jungle HQ",
			centerX: 0,
			centerZ: -20,
			halfWidth: 10,
			halfDepth: 10,
			connections: [RoomId.BeachShack, RoomId.Watchtower, RoomId.Compound],
			spawnableItems: [ItemType.SecretDocuments]
		},
		{
			id: RoomId.Watchtower,
			displayName: "Watchtower",
			centerX: 28,
			centerZ: -20,
			halfWidth: 10,
			halfDepth: 10,
			connections: [RoomId.JungleHQ, RoomId.Library],
			spawnableItems: [ItemType.Passport]
		},
		{
			id: RoomId.CoveCave,
			displayName: "Cove Cave",
			centerX: -28,
			centerZ: 20,
			halfWidth: 10,
			halfDepth: 10,
			connections: [RoomId.BeachShack, RoomId.Compound],
			spawnableItems: [ItemType.KeyCard]
		},
		{
			id: RoomId.Compound,
			displayName: "Compound",
			centerX: 0,
			centerZ: 20,
			halfWidth: 10,
			halfDepth: 10,
			connections: [RoomId.JungleHQ, RoomId.CoveCave, RoomId.Library],
			spawnableItems: [ItemType.SecretDocuments, ItemType.Passport, ItemType.KeyCard, ItemType.MoneyBag]
		},
		{
			id: RoomId.Library,
			displayName: "Library",
			centerX: 28,
			centerZ: 20,
			halfWidth: 12,
			halfDepth: 10,
			connections: [RoomId.Watchtower, RoomId.Compound],
			spawnableItems: []
		}
	];

/** Black spy spawn X position (start at Beach Shack). */
export const BLACK_SPY_SPAWN_X: number = -28;

/** Black spy spawn Z position. */
export const BLACK_SPY_SPAWN_Z: number = -20;

/** White spy spawn X position (start at Watchtower). */
export const WHITE_SPY_SPAWN_X: number = 28;

/** White spy spawn Z position. */
export const WHITE_SPY_SPAWN_Z: number = -20;

/** Number of required mission items to collect before escaping. */
export const REQUIRED_ITEM_COUNT: number = 4;

// ─── Doorways ──────────────────────────────────────────────────────────────

/** Width of doorway openings between connected rooms (in world units). */
export const DOORWAY_WIDTH: number = 5;

// ─── Furniture ─────────────────────────────────────────────────────────────

/** Search interaction radius for furniture (in world units). */
export const FURNITURE_SEARCH_RADIUS: number = 2.5;

/** Furniture placement definitions per room. */
export const ROOM_FURNITURE: ReadonlyArray<FurnitureDefinition> =
	[
		{
			id: "bshack-barrel",
			type: FurnitureType.Barrel,
			roomId: RoomId.BeachShack,
			offsetX: -4,
			offsetZ: -3,
			searchable: true
		},
		{
			id: "bshack-desk",
			type: FurnitureType.Desk,
			roomId: RoomId.BeachShack,
			offsetX: 3,
			offsetZ: 2,
			searchable: true
		},
		{
			id: "bshack-crate",
			type: FurnitureType.Crate,
			roomId: RoomId.BeachShack,
			offsetX: -2,
			offsetZ: 5,
			searchable: true
		},
		{
			id: "jhq-cabinet",
			type: FurnitureType.Cabinet,
			roomId: RoomId.JungleHQ,
			offsetX: -5,
			offsetZ: -4,
			searchable: true
		},
		{ id: "jhq-desk", type: FurnitureType.Desk, roomId: RoomId.JungleHQ, offsetX: 4, offsetZ: 3, searchable: true },
		{
			id: "jhq-bookshelf",
			type: FurnitureType.Bookshelf,
			roomId: RoomId.JungleHQ,
			offsetX: 0,
			offsetZ: -6,
			searchable: true
		},
		{
			id: "watch-barrel",
			type: FurnitureType.Barrel,
			roomId: RoomId.Watchtower,
			offsetX: 3,
			offsetZ: -5,
			searchable: true
		},
		{
			id: "watch-crate",
			type: FurnitureType.Crate,
			roomId: RoomId.Watchtower,
			offsetX: -4,
			offsetZ: 4,
			searchable: true
		},
		{ id: "watch-desk", type: FurnitureType.Desk, roomId: RoomId.Watchtower, offsetX: 5, offsetZ: 2, searchable: true },
		{
			id: "cove-cabinet",
			type: FurnitureType.Cabinet,
			roomId: RoomId.CoveCave,
			offsetX: -3,
			offsetZ: -5,
			searchable: true
		},
		{
			id: "cove-barrel",
			type: FurnitureType.Barrel,
			roomId: RoomId.CoveCave,
			offsetX: 4,
			offsetZ: 3,
			searchable: true
		},
		{ id: "cove-crate", type: FurnitureType.Crate, roomId: RoomId.CoveCave, offsetX: -5, offsetZ: 6, searchable: true },
		{ id: "comp-desk", type: FurnitureType.Desk, roomId: RoomId.Compound, offsetX: -4, offsetZ: -4, searchable: true },
		{
			id: "comp-bookshelf",
			type: FurnitureType.Bookshelf,
			roomId: RoomId.Compound,
			offsetX: 5,
			offsetZ: 0,
			searchable: true
		},
		{
			id: "comp-barrel",
			type: FurnitureType.Barrel,
			roomId: RoomId.Compound,
			offsetX: 2,
			offsetZ: 5,
			searchable: true
		},
		{ id: "lib-crate", type: FurnitureType.Crate, roomId: RoomId.Library, offsetX: -6, offsetZ: -3, searchable: true },
		{ id: "lib-barrel", type: FurnitureType.Barrel, roomId: RoomId.Library, offsetX: 6, offsetZ: 4, searchable: true },
		{
			id: "lib-cabinet",
			type: FurnitureType.Cabinet,
			roomId: RoomId.Library,
			offsetX: 0,
			offsetZ: -6,
			searchable: true
		}
	];

// ─── Room Column Groupings ─────────────────────────────────────────────────

/**
 * Room IDs in the left column of the island grid (centerX = -28).
 * Used for item distribution constraint — ensures items span multiple columns.
 */
export const LEFT_COLUMN_ROOMS: ReadonlyArray<RoomId> =
	[RoomId.BeachShack, RoomId.CoveCave];

/**
 * Room IDs in the center column of the island grid (centerX = 0).
 * Used for item distribution constraint — ensures items span multiple columns.
 */
export const CENTER_COLUMN_ROOMS: ReadonlyArray<RoomId> =
	[RoomId.JungleHQ, RoomId.Compound];

/**
 * Room IDs in the right column of the island grid (centerX = 28).
 * Used for item distribution constraint — ensures items span multiple columns.
 */
export const RIGHT_COLUMN_ROOMS: ReadonlyArray<RoomId> =
	[RoomId.Watchtower, RoomId.Library];

/**
 * All room column groupings for distribution constraint validation.
 * Each entry maps a column to its room IDs.
 */
export const ROOM_COLUMNS: ReadonlyArray<ReadonlyArray<RoomId>> =
	[
		LEFT_COLUMN_ROOMS,
		CENTER_COLUMN_ROOMS,
		RIGHT_COLUMN_ROOMS
	];

// ─── Outside Areas ─────────────────────────────────────────────────────────

/** Outside area depth beyond room walls (in world units). */
export const OUTSIDE_AREA_DEPTH: number = 12;

// ─── Airstrip Zone ─────────────────────────────────────────────────────────

/** Airstrip center X position (centered on island). */
export const AIRSTRIP_CENTER_X: number = 0;

/** Airstrip center Z position (south end of island, beyond room grid). */
export const AIRSTRIP_CENTER_Z: number = 38;

/** Airstrip runway length — along X axis, east-west (world units). */
export const AIRSTRIP_RUNWAY_LENGTH: number = 50;

/** Airstrip runway width — along Z axis, north-south (world units). */
export const AIRSTRIP_RUNWAY_WIDTH: number = 8;

/** Airstrip trigger radius — how close player must be to trigger escape. */
export const AIRSTRIP_TRIGGER_RADIUS: number = 5;

// ─── Airplane ──────────────────────────────────────────────────────────────

/** Airplane fuselage body length (world units). */
export const AIRPLANE_FUSELAGE_LENGTH: number = 6;

/** Total wing span of the airplane (world units). */
export const AIRPLANE_WING_SPAN: number = 8;

/** Total duration of the takeoff animation in seconds. */
export const AIRPLANE_TAKEOFF_DURATION_SECONDS: number = 7;

/** Distance covered on runway before liftoff (world units). */
export const AIRPLANE_RUNWAY_ACCELERATION_DISTANCE: number = 40;

/** Maximum altitude reached during climb-away phase (world units). */
export const AIRPLANE_CLIMB_ALTITUDE: number = 40;

/** Horizontal distance covered during climb-away phase (world units). */
export const AIRPLANE_CLIMB_DISTANCE: number = 30;

/** Parked airplane Y offset above ground (world units). */
export const AIRPLANE_PARKED_Y: number = 0.8;

/** Parked airplane rotation Y — facing east (positive X direction). */
export const AIRPLANE_PARKED_ROTATION_Y: number =
	-Math.PI / 2;

// ─── Explosion ─────────────────────────────────────────────────────────────

/** Total explosion animation duration in seconds. */
export const EXPLOSION_DURATION_SECONDS: number = 6;

/** Fire burst particle count. */
export const EXPLOSION_FIRE_PARTICLE_COUNT: number = 5000;

/** Flying debris particle count. */
export const EXPLOSION_DEBRIS_PARTICLE_COUNT: number = 1600;

/** Smoke plume particle count. */
export const EXPLOSION_SMOKE_PARTICLE_COUNT: number = 2200;

// ─── Outside Decor ─────────────────────────────────────────────────────────

/** Number of decorative trees along each outside edge. */
export const OUTSIDE_TREE_COUNT: number = 12;

/** Trunk height of a palm tree. */
export const TREE_TRUNK_HEIGHT: number = 5;

/** Trunk diameter of a palm tree. */
export const TREE_TRUNK_DIAMETER: number = 0.6;

/** Canopy diameter of a palm tree. */
export const TREE_CANOPY_DIAMETER: number = 4.5;

/** Canopy height (vertical ellipsoid) of a palm tree. */
export const TREE_CANOPY_HEIGHT: number = 3.5;

/** Scale multiplier applied to all trees (1.0 = default, 1.5 = 50% larger). */
export const TREE_SCALE_MULTIPLIER: number = 1.5;

// ─── Timer ─────────────────────────────────────────────────────────────────

/** Total island self-destruct timer in seconds. */
export const GAME_TIMER_SECONDS: number = 360;

/** Seconds deducted from the island timer on each death. */
export const DEATH_TIMER_PENALTY_SECONDS: number = 15;

// ─── Combat ────────────────────────────────────────────────────────────────

/** Combat engagement radius (world units). */
export const COMBAT_ENGAGE_RADIUS: number = 2.0;

/** Duration of combat animation in seconds. */
export const COMBAT_DURATION_SECONDS: number = 2;

/** Duration of death animation in seconds. */
export const DEATH_ANIMATION_SECONDS: number = 3;

/** Height the spy floats up during death animation. */
export const DEATH_FLOAT_HEIGHT: number = 8;

/** Halo ring radius above spy head during death. */
export const HALO_RADIUS: number = 0.6;

/** Number of star meshes orbiting stunned spy. */
export const STUN_STAR_COUNT: number = 3;

/** Radius of each stun star sphere. */
export const STUN_STAR_RADIUS: number = 0.12;

/** Orbit radius of stun stars around spy head. */
export const STUN_STAR_ORBIT_RADIUS: number = 0.8;

/** Orbit speed of stun stars in radians per second. */
export const STUN_STAR_ORBIT_SPEED: number = 4;

// ─── Remedies ──────────────────────────────────────────────────────────────

/** Remedy defusal definitions. */
export const REMEDY_DEFUSES: ReadonlyArray<RemedyItem> =
	[
		{ type: RemedyType.WireCutters, defuses: TrapType.Bomb },
		{ type: RemedyType.Shield, defuses: TrapType.SpringTrap }
	];

/** Initial inventory count per trap type per spy (one of each). */
export const INITIAL_TRAP_COUNT_PER_TYPE: number = 1;

/** Maximum remedies hidden in furniture globally. */
export const MAX_REMEDIES_IN_WORLD: number = 4;

// ─── Furniture Colors ──────────────────────────────────────────────────────

/** Barrel mesh color (warm brown). */
export const FURNITURE_BARREL_COLOR: string = "#8B5E3C";

/** Crate mesh color (golden wood). */
export const FURNITURE_CRATE_COLOR: string = "#B8860B";

/** Desk mesh color (medium brown). */
export const FURNITURE_DESK_COLOR: string = "#5D4037";

/** Cabinet mesh color (deep red). */
export const FURNITURE_CABINET_COLOR: string = "#8B2E2E";

/** Bookshelf mesh color (walnut). */
export const FURNITURE_BOOKSHELF_COLOR: string = "#6D4C41";

// ─── Outside Decor Colors ──────────────────────────────────────────────────

/** Tree trunk color (saddle brown). */
export const TREE_TRUNK_COLOR: string = "#8B4513";

/** Tree canopy color (forest green). */
export const TREE_CANOPY_COLOR: string = "#228B22";

/** Rock color (gray). */
export const ROCK_COLOR: string = "#808080";

/** Beach sand color. */
export const BEACH_SAND_COLOR: string = "#E8D5A3";