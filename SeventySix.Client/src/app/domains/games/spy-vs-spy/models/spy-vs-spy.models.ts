// <copyright file="spy-vs-spy.models.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy vs Spy Island game model definitions.
 * Enums, interfaces, and types for the spy game.
 */

import type { Scene } from "@babylonjs/core/scene";

/**
 * Spy identity — which spy the player controls.
 */
export enum SpyIdentity
{
	/** The Black Spy (player-controlled). */
	Black = "Black",

	/** The White Spy (AI-controlled). */
	White = "White"
}

/**
 * Island room identifiers.
 * Matches the island map layout defined in Implementation.md Appendix B.
 */
export enum RoomId
{
	/** Sandy beach area with bamboo shack. */
	BeachShack = "BeachShack",

	/** Dense jungle — enemy headquarters. */
	JungleHQ = "JungleHQ",

	/** Elevated tower with visibility across island. */
	Watchtower = "Watchtower",

	/** Dark cave entrance on the rocky cove. */
	CoveCave = "CoveCave",

	/** Concrete compound with supply barrels. */
	Compound = "Compound",

	/** Cozy hideout library with bookshelves. */
	Library = "Library"
}

/**
 * Collectable mission item types.
 * Player must collect all four to escape.
 */
export enum ItemType
{
	/** Classified intelligence documents. */
	SecretDocuments = "SecretDocuments",

	/** Official travel passport. */
	Passport = "Passport",

	/** Electronic key card for the escape gate. */
	KeyCard = "KeyCard",

	/** Bribe money for the pilot. */
	MoneyBag = "MoneyBag"
}

/**
 * Trap types available for placement.
 */
export enum TrapType
{
	/** Explosive device — stuns spy and causes them to drop a random item. */
	Bomb = "Bomb",

	/** Spring-loaded mechanism — launches spy back to their spawn point. */
	SpringTrap = "Spring"
}

/**
 * Overall game lifecycle states.
 */
export enum SpyGameState
{
	/** Awaiting player to start the game. */
	Idle = "Idle",

	/** Babylon.js scene assets loading. */
	Loading = "Loading",

	/** Scene ready — countdown before gameplay. */
	Ready = "Ready",

	/** Active gameplay phase. */
	Playing = "Playing",

	/** Player reached airstrip with all items — plane taking off. */
	Escaping = "Escaping",

	/** Island is exploding — post-takeoff or timer expiry. */
	Exploding = "Exploding",

	/** Player collected all items and escaped. */
	Won = "Won",

	/** AI spy collected all items and escaped first. */
	Lost = "Lost"
}

/**
 * Spy stun states for combat/trap reactions.
 */
export enum StunState
{
	/** Not currently stunned. */
	None = "None",

	/** Stunned by a bomb trap — drops a random item. */
	BombStunned = "BombStunned",

	/** Launched by a spring trap — returning to spawn. */
	SpringLaunched = "SpringLaunched"
}

/**
 * Types of furniture that can appear in rooms.
 */
export enum FurnitureType
{
	/** Wooden barrel container. */
	Barrel = "Barrel",

	/** Wooden crate container. */
	Crate = "Crate",

	/** Writing desk with drawers. */
	Desk = "Desk",

	/** Tall cabinet with doors. */
	Cabinet = "Cabinet",

	/** Wall-mounted bookshelf. */
	Bookshelf = "Bookshelf"
}

/**
 * Which player's turn is currently active.
 */
export enum TurnPhase
{
	/** Black Spy (Player 1) is in control. */
	Player1 = "Player1",

	/** White Spy (Player 2) is in control. */
	Player2 = "Player2"
}

/**
 * Result of a combat encounter.
 */
export enum CombatResult
{
	/** Player 1 (Black Spy) wins the fight. */
	Player1Wins = "Player1Wins",

	/** Player 2 (White Spy) wins the fight. */
	Player2Wins = "Player2Wins",

	/** The fight ends in a draw. */
	Draw = "Draw"
}

/**
 * Remedy items that defuse matching trap types.
 */
export enum RemedyType
{
	/** Defuses Bomb traps. */
	WireCutters = "WireCutters",

	/** Defuses SpringTrap traps. */
	Shield = "Shield"
}

/**
 * What a spy finds when searching furniture.
 */
export enum SearchResult
{
	/** Furniture is empty. */
	Empty = "Empty",

	/** Furniture contains a mission item. */
	FoundItem = "FoundItem",

	/** Furniture contains an active trap. */
	FoundTrap = "FoundTrap",

	/** Furniture contains a remedy. */
	FoundRemedy = "FoundRemedy"
}

/**
 * Represents a single island room in the game world.
 */
export interface RoomDefinition
{
	/** Unique room identifier. */
	readonly id: RoomId;

	/** Display name shown in the HUD. */
	readonly displayName: string;

	/** World-space center position (x, z) — y is always 0 (ground level). */
	readonly centerX: number;
	readonly centerZ: number;

	/** Room half-extent for collision (width/2 and depth/2). */
	readonly halfWidth: number;
	readonly halfDepth: number;

	/** Connected room IDs (bidirectional). */
	readonly connections: ReadonlyArray<RoomId>;

	/** Items that can spawn in this room. */
	readonly spawnableItems: ReadonlyArray<ItemType>;
}

/**
 * Represents an item in the world.
 */
export interface WorldItem
{
	/** Unique instance ID. */
	readonly instanceId: string;

	/** Item type. */
	readonly type: ItemType;

	/** Room the item is currently in. */
	roomId: RoomId;

	/** World-space position. */
	positionX: number;
	positionZ: number;

	/** Whether the item has been picked up. */
	collected: boolean;

	/** Which spy collected it (undefined if not yet collected). */
	collectedBy?: SpyIdentity;

	/** Furniture ID the item is hidden in, or null for ground items. */
	furnitureId: string | null;
}

/**
 * Represents a placed trap in the world.
 */
export interface PlacedTrap
{
	/** Unique instance ID. */
	readonly instanceId: string;

	/** Trap type. */
	readonly type: TrapType;

	/** Room the trap is in. */
	readonly roomId: RoomId;

	/** World-space position. */
	readonly positionX: number;
	readonly positionZ: number;

	/** Which spy placed this trap (immune to own traps). */
	readonly placedBy: SpyIdentity;

	/** Whether the trap has already triggered. */
	triggered: boolean;

	/** Furniture ID the trap is attached to, or null for ground traps. */
	readonly furnitureId: string | null;
}

/**
 * Runtime state for a single spy (player or AI).
 */
export interface SpyState
{
	/** Which spy this is. */
	readonly identity: SpyIdentity;

	/** Current room the spy is in. */
	currentRoomId: RoomId;

	/** World-space position. */
	positionX: number;
	positionZ: number;

	/** Facing angle in radians. */
	rotationY: number;

	/** Items currently held by this spy. */
	readonly inventory: ItemType[];

	/** Remedy items held by this spy. */
	readonly remedies: RemedyType[];

	/** Current stun state. */
	stunState: StunState;

	/** Remaining stun duration in seconds (0 when not stunned). */
	stunRemainingSeconds: number;

	/** Personal countdown timer in seconds. */
	personalTimer: number;
}

/**
 * A furniture piece placed in a room that can be searched.
 */
export interface FurnitureDefinition
{
	/** Unique furniture identifier. */
	readonly id: string;

	/** Type of furniture. */
	readonly type: FurnitureType;

	/** Room this furniture belongs to. */
	readonly roomId: RoomId;

	/** X offset from room center. */
	readonly offsetX: number;

	/** Z offset from room center. */
	readonly offsetZ: number;

	/** Whether this furniture can currently be searched. */
	searchable: boolean;
}

/**
 * A remedy item found in furniture that defuses a matching trap type.
 */
export interface RemedyItem
{
	/** Remedy type. */
	readonly type: RemedyType;

	/** Which trap type this remedy defuses. */
	readonly defuses: TrapType;
}

/**
 * State of a player in two-player mode.
 */
export interface PlayerState
{
	/** Spy identity. */
	readonly identity: SpyIdentity;

	/** Turn phase assignment. */
	readonly turnPhase: TurnPhase;

	/** Current room. */
	currentRoomId: RoomId;

	/** World-space X position. */
	positionX: number;

	/** World-space Z position. */
	positionZ: number;

	/** Facing angle in radians. */
	rotationY: number;

	/** Collected mission items. */
	readonly inventory: ItemType[];

	/** Held remedy items. */
	readonly remedies: RemedyType[];

	/** Current stun state. */
	stunState: StunState;

	/** Remaining stun duration in seconds. */
	stunRemainingSeconds: number;

	/** Personal countdown timer in seconds. */
	personalTimer: number;

	/** Whether the player is still alive (timer not expired). */
	alive: boolean;
}

/**
 * Physics state snapshot returned by SpyPhysicsService.getState().
 */
export interface SpyPhysicsState
{
	/** World-space X position. */
	readonly positionX: number;

	/** World-space Z position. */
	readonly positionZ: number;

	/** Facing angle in radians. */
	readonly rotationY: number;

	/** Current stun state. */
	readonly stunState: StunState;

	/** Remaining stun duration in seconds. */
	readonly stunRemainingSeconds: number;
}

/**
 * Result of a furniture search attempt.
 */
export interface SearchAttemptResult
{
	/** What was found. */
	readonly result: SearchResult;

	/** Item type found, if any. */
	readonly itemType?: ItemType;

	/** Trap type found, if any. */
	readonly trapType?: TrapType;

	/** Identity of the spy who placed the trap, if any. */
	readonly trapPlacedBy?: SpyIdentity;

	/** Remedy type found, if any. */
	readonly remedyType?: RemedyType;

	/** Whether this FoundRemedy result came from auto-defusing a trap (not a pickup). */
	readonly wasDefusal?: boolean;

	/** ID of the furniture that was searched. */
	readonly furnitureId: string;
}

/**
 * Parameters for placing a trap in the scene.
 */
export interface PlaceTrapParams
{
	/** The Babylon.js Scene to create the trap mesh in. */
	readonly scene: Scene;
	/** The room where the trap is placed. */
	readonly roomId: RoomId;
	/** World-space X position. */
	readonly positionX: number;
	/** World-space Z position. */
	readonly positionZ: number;
	/** Which spy placed this trap. */
	readonly placedBy: SpyIdentity;
}