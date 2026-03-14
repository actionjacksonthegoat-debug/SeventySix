import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";

/**
 * Game state enumeration for Galactic Assault.
 * Tracks the current phase of the game lifecycle.
 */
export enum GameState
{
	/** Title screen before gameplay starts. */
	Title = "Title",

	/** Active gameplay. */
	Playing = "Playing",

	/** Game is paused by the player. */
	Paused = "Paused",

	/** Player has lost all lives. */
	GameOver = "GameOver",

	/** Player has defeated the boss and cleared the level. */
	Victory = "Victory"
}

/**
 * Weapon type enumeration for Galactic Assault.
 * Defines the available weapon types for the player's ship.
 */
export enum WeaponType
{
	/** Default single-shot weapon. */
	MachineGun = "MachineGun",

	/** Fires three projectiles in a spread pattern. */
	SpreadGun = "SpreadGun",

	/** Fires a continuous beam with high damage. */
	Laser = "Laser",

	/** Fires at an increased rate. */
	RapidFire = "RapidFire"
}

/**
 * Power-up type enumeration for Galactic Assault.
 * Defines collectible power-ups that spawn during gameplay.
 */
export enum PowerUpType
{
	/** Upgrades weapon to spread gun. */
	SpreadGun = "SpreadGun",

	/** Upgrades weapon to laser beam. */
	Laser = "Laser",

	/** Upgrades weapon to rapid fire. */
	RapidFire = "RapidFire",

	/** Grants a screen-clearing nuke ability. */
	Nuke = "Nuke"
}

/**
 * Enemy type enumeration for Galactic Assault.
 * Categorizes enemies by difficulty and behavior.
 */
export enum EnemyType
{
	/** Standard enemy with basic movement. */
	Standard = "Standard",

	/** Elite enemy with more health and aggressive patterns. */
	Elite = "Elite",

	/**
	 * Boss enemy — the Beholder with destructible eye tentacles.
	 */
	Boss = "Boss"
}

/**
 * Represents the current state of the player's ship.
 */
export interface PlayerState
{
	/** X-axis position in world space. */
	positionX: number;

	/** Y-axis position in world space. */
	positionY: number;

	/** Z-axis position in world space. */
	positionZ: number;

	/** Rotation around X-axis (pitch). */
	rotationX: number;

	/** Rotation around Y-axis (yaw). */
	rotationY: number;

	/** Rotation around Z-axis (roll). */
	rotationZ: number;

	/** Remaining player lives. */
	lives: number;

	/** Current accumulated score. */
	score: number;

	/** Currently equipped weapon type. */
	weapon: WeaponType;

	/** Whether the player has a nuke available. */
	hasNuke: boolean;
}

/**
 * Represents the state of an individual enemy.
 */
export interface EnemyState
{
	/** Unique identifier for the enemy instance. */
	identifier: string;

	/** X-axis position in world space. */
	positionX: number;

	/** Y-axis position in world space. */
	positionY: number;

	/** Z-axis position in world space. */
	positionZ: number;

	/** Remaining health points. */
	health: number;

	/** The classification of this enemy. */
	type: EnemyType;

	/** Points awarded when destroyed. */
	points: number;
}

/**
 * Represents a projectile fired by the player or enemies.
 */
export interface ProjectileState
{
	/** Unique identifier for the projectile instance. */
	identifier: string;

	/** X-axis position in world space. */
	positionX: number;

	/** Y-axis position in world space. */
	positionY: number;

	/** Z-axis position in world space. */
	positionZ: number;

	/** X-axis direction vector component. */
	directionX: number;

	/** Y-axis direction vector component. */
	directionY: number;

	/** Z-axis direction vector component. */
	directionZ: number;

	/** Damage dealt on impact. */
	damage: number;

	/** The weapon type that created this projectile. */
	weaponType: WeaponType;

	/** Whether this projectile was fired by the player (true) or enemy (false). */
	isPlayerProjectile: boolean;
}

/**
 * Game configuration for a given level.
 */
export interface GameConfig
{
	/** Current level number. */
	level: number;

	/** Multiplier applied to enemy speed and spawn rate. */
	difficultyMultiplier: number;
}

/**
 * Configuration options for engine creation.
 */
export interface EngineOptions
{
	/**
	 * When true, uses NullEngine instead of WebGL Engine.
	 * Useful for testing environments without GPU access.
	 * @type {boolean}
	 */
	useNullEngine?: boolean;
}

/**
 * Represents an entity that participates in collision detection.
 */
export interface CollidableEntity
{
	/** The mesh whose position is used for collision checks. */
	mesh: Mesh;

	/** Bounding sphere radius for collision detection. */
	radius: number;

	/** Collision group identifier (e.g., "player", "enemy", "projectile"). */
	group: string;
}

/**
 * Result of a collision between two entities.
 */
export interface CollisionResult
{
	/** The first entity in the collision pair. */
	entityA: CollidableEntity;

	/** The second entity in the collision pair. */
	entityB: CollidableEntity;
}

/**
 * Represents an active enemy instance in the game.
 */
export interface EnemyInstance
{
	/** Unique identifier. */
	identifier: string;

	/** The enemy's 3D mesh. */
	mesh: Mesh;

	/** Remaining health points. */
	health: number;

	/** Enemy classification. */
	type: EnemyType;

	/** Points awarded for destruction. */
	points: number;
}

/**
 * Represents an active power-up instance in the game world.
 */
export interface PowerUpInstance
{
	/** The power-up's 3D mesh. */
	mesh: Mesh;

	/** The type of power-up. */
	type: PowerUpType;

	/** Time remaining before despawn in seconds. */
	timeRemaining: number;
}

/**
 * Represents an active projectile in the game world.
 */
export interface Projectile
{
	/** The projectile's 3D mesh. */
	mesh: Mesh;

	/** Normalized movement direction. */
	direction: Vector3;

	/** Movement speed in world units per second. */
	speed: number;

	/** Damage dealt on hit. */
	damage: number;

	/** Distance traveled from origin. */
	distanceTraveled: number;

	/** Whether this projectile pierces through enemies. */
	piercing: boolean;
}

/**
 * Options for creating a projectile instance.
 */
export interface ProjectileOptions
{
	/** The Babylon.js scene. */
	scene: Scene;

	/** The starting position. */
	position: Vector3;

	/** The movement direction. */
	direction: Vector3;

	/** Damage dealt on hit. */
	damage: number;

	/** Whether the projectile pierces through enemies. */
	piercing: boolean;

	/** The emissive color of the projectile. */
	color: Color3;
}

/**
 * Context passed to the collision handler each frame.
 */
export interface CollisionFrameContext
{
	/** Whether the boss phase is currently active. */
	bossPhaseActive: boolean;

	/** Remaining invincibility time in seconds. */
	invincibilityTimer: number;

	/** The active Babylon.js scene for spawning. */
	activeScene: Scene | null;

	/** The player ship world position. */
	playerPosition: Vector3 | null;
}

/**
 * Result of collision processing for a single frame.
 */
export interface CollisionFrameResult
{
	/** Whether the HUD needs to be refreshed. */
	hudUpdateNeeded: boolean;

	/** Whether the player was hit by an enemy. */
	playerHit: boolean;

	/** Whether the player lost all lives. */
	isGameOver: boolean;

	/** Power-up types collected this frame. */
	collectedPowerUps: PowerUpType[];
}