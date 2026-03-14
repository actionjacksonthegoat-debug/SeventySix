/**
 * Game tuning constants for Galactic Assault.
 * Central repository for all gameplay balance values.
 * Adjust these values to tune game difficulty and feel.
 */

import { InjectionToken } from "@angular/core";
import type { EngineOptions } from "@sandbox/models/game.models";

// ──────────────────────────────────────────────
// Injection Tokens
// ──────────────────────────────────────────────

/**
 * Injection token for providing default engine options.
 * Used in test environments to inject NullEngine configuration.
 * @type {InjectionToken<EngineOptions>}
 */
export const BABYLON_ENGINE_OPTIONS: InjectionToken<EngineOptions> =
	new InjectionToken<EngineOptions>(
		"BABYLON_ENGINE_OPTIONS");

// ──────────────────────────────────────────────
// Player Constants
// ──────────────────────────────────────────────

/** Player ship movement speed in world units per second. */
export const PLAYER_SPEED: number = 15;

/** Player ship turn/rotation rate in radians per second. */
export const PLAYER_TURN_RATE: number = 2.5;

/** Number of lives the player starts with. */
export const PLAYER_STARTING_LIVES: number = 3;

/** Duration of player invincibility after respawning, in seconds. */
export const PLAYER_INVINCIBILITY_DURATION: number = 2;

// ──────────────────────────────────────────────
// Enemy Constants
// ──────────────────────────────────────────────

/** Points awarded for destroying a standard enemy. */
export const ENEMY_BASE_POINTS: number = 100;

/** Points awarded for destroying an elite enemy. */
export const ENEMY_ELITE_POINTS: number = 250;

/** Number of columns in the enemy wave grid. */
export const ENEMY_WAVE_COLUMNS: number = 8;

/** Number of rows in the enemy wave grid. */
export const ENEMY_WAVE_ROWS: number = 5;

/** Total number of enemies in a standard wave (rows × columns). */
export const ENEMY_WAVE_SIZE: number =
	ENEMY_WAVE_ROWS * ENEMY_WAVE_COLUMNS;

/** Base movement speed of standard enemies. */
export const ENEMY_BASE_SPEED: number = 3;

/** Health points for a standard enemy. */
export const ENEMY_STANDARD_HEALTH: number = 1;

/** Health points for an elite enemy. */
export const ENEMY_ELITE_HEALTH: number = 3;

/** Horizontal spacing between enemies in the grid formation. */
export const ENEMY_SPACING_X: number = 2.5;

/** Vertical spacing between enemies in the grid formation. */
export const ENEMY_SPACING_Y: number = 2;

/** Enemy fire rate — minimum seconds between enemy shots. */
export const ENEMY_FIRE_INTERVAL: number = 1.5;

// ──────────────────────────────────────────────
// Weapon Constants
// ──────────────────────────────────────────────

/** Fire rate for the machine gun in shots per second. */
export const WEAPON_MACHINE_GUN_FIRE_RATE: number = 5;

/** Fire rate for the spread gun in shots per second. */
export const WEAPON_SPREAD_GUN_FIRE_RATE: number = 3;

/** Fire rate for rapid fire in shots per second. */
export const WEAPON_RAPID_FIRE_RATE: number = 10;

/** Projectile speed in world units per second. */
export const PROJECTILE_SPEED: number = 40;

/** Damage dealt by a single machine gun projectile. */
export const WEAPON_MACHINE_GUN_DAMAGE: number = 1;

/** Damage dealt by a single spread gun projectile. */
export const WEAPON_SPREAD_GUN_DAMAGE: number = 1;

/** Damage dealt by the laser per tick. */
export const WEAPON_LASER_DAMAGE: number = 2;

/** Damage dealt by a single rapid fire projectile. */
export const WEAPON_RAPID_FIRE_DAMAGE: number = 1;

/** Spread angle in radians for the spread gun's outer projectiles. */
export const WEAPON_SPREAD_ANGLE: number = 0.3;

// ──────────────────────────────────────────────
// Power-Up Constants
// ──────────────────────────────────────────────

/** Number of enemy kills between power-up spawns. */
export const POWERUP_SPAWN_INTERVAL: number = 15;

/** Duration in seconds that a non-nuke power-up remains active. */
export const POWERUP_DURATION: number = 20;

/** Maximum number of nukes the player can hold per level. */
export const NUKE_LIMIT: number = 1;

/** Speed at which power-up pickups float toward the player. */
export const POWERUP_FLOAT_SPEED: number = 5;

// ──────────────────────────────────────────────
// Boss Constants
// ──────────────────────────────────────────────

/** Total health of the boss (number of destructible eyes). */
export const BOSS_HEALTH: number = 10;

/** Points awarded for defeating the boss. */
export const BOSS_POINTS: number = 2000;

/** Number of eye tentacles on the Beholder boss. */
export const BOSS_EYE_COUNT: number = 10;

/** Boss movement speed in world units per second. */
export const BOSS_SPEED: number = 2;

/** Interval in seconds between boss attack volleys. */
export const BOSS_ATTACK_INTERVAL: number = 2;

// ──────────────────────────────────────────────
// Scoring Constants
// ──────────────────────────────────────────────

/** Score threshold at which the player earns a free extra life. */
export const FREE_LIFE_THRESHOLD: number = 10000;

// ──────────────────────────────────────────────
// Physics / World Constants
// ──────────────────────────────────────────────

/** Half-width of the playable world area on the X-axis. */
export const WORLD_BOUND_X: number = 30;

/** Half-height of the playable world area on the Y-axis. */
export const WORLD_BOUND_Y: number = 20;

/** Depth of the playable world area on the Z-axis. */
export const WORLD_BOUND_Z: number = 100;

/** Collision radius for the player ship. */
export const PLAYER_COLLISION_RADIUS: number = 1.0;

/** Collision radius for standard enemy meshes. */
export const ENEMY_COLLISION_RADIUS: number = 0.8;

/** Collision radius for projectiles. */
export const PROJECTILE_COLLISION_RADIUS: number = 0.3;

/** Collision radius for power-up pickups. */
export const POWERUP_COLLISION_RADIUS: number = 1.2;

/** Collision radius for boss eye tentacles. */
export const BOSS_EYE_COLLISION_RADIUS: number = 0.6;