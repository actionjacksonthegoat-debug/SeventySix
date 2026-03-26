/**
 * Car-a-Lot game tuning constants.
 * All physics, camera, timing, and visual constants for the driving game.
 */

import { Color3 } from "@babylonjs/core/Maths/math.color";

// ─── Physics ───────────────────────────────────────────────────────

/** Maximum kart speed in miles per hour. */
export const MAX_SPEED_MPH: number = 75;

/** Time in seconds to reach max speed from standstill. */
export const ACCELERATION_TIME_SECONDS: number = 3;

/** Turn speed in radians per second. */
export const TURN_SPEED: number = 2.5;

/** Gravity acceleration (negative = downward). */
export const GRAVITY: number = -30;

/** Vertical offset of kart root above road surface so wheel bottoms touch the road.
 *  Equal to the wheel cylinder radius (0.3 world units). */
export const KART_GROUND_OFFSET: number = 0.3;

/** Initial upward velocity for jumps. */
export const JUMP_VELOCITY: number = 15;

// ─── Track ─────────────────────────────────────────────────────────

/** Road surface width in world units (~65% screen width at default camera). */
export const ROAD_WIDTH: number = 30;

/** Bumper strip width on each side of the road. */
export const BUMPER_WIDTH: number = 2;

/** Bounce force applied when hitting a bumper. */
export const BUMPER_BOUNCE_FORCE: number = 1;

/** Bumper speed retention factor (1.0 = keep all speed). */
export const BUMPER_SPEED_RETENTION: number = 0.92;

/** Maximum heading change from a bumper hit (radians). */
export const BUMPER_MAX_HEADING_CHANGE: number = 0.15;

/** Number of decorative trees along the track. */
export const TREE_COUNT: number = 200;

/** Number of decorative rocks along the track. */
export const ROCK_COUNT: number = 80;

// ─── Camera ────────────────────────────────────────────────────────

/** Camera follow distance behind the kart in world units. */
export const CAMERA_DISTANCE_BACK: number = 20;

/** Camera height above the kart in world units. */
export const CAMERA_HEIGHT: number = 10;

// ─── Timing ────────────────────────────────────────────────────────

/** Target race duration in seconds (~1:30). */
export const RACE_DURATION_TARGET: number = 90;

/** Duration of octopus tentacle driving section in seconds. */
export const OCTOPUS_TENTACLE_DRIVE_TIME: number = 15;

/** Countdown duration before race start in seconds. */
export const COUNTDOWN_DURATION: number = 3;

// ─── Visual Colors ─────────────────────────────────────────────────

/** Light green ground surface color. */
export const GROUND_COLOR: Color3 =
	new Color3(0.6, 0.85, 0.4);

/** Light blue-green tree canopy color. */
export const TREE_TOP_COLOR: Color3 =
	new Color3(0.4, 0.7, 0.55);

/** Medium brown tree trunk color. */
export const TREE_TRUNK_COLOR: Color3 =
	new Color3(0.55, 0.35, 0.2);

/** Gold decorative rock color. */
export const GOLD_ROCK_COLOR: Color3 =
	new Color3(0.85, 0.75, 0.3);

/** Silver decorative rock color. */
export const SILVER_ROCK_COLOR: Color3 =
	new Color3(0.75, 0.75, 0.78);

/** Light gray road surface color. */
export const ROAD_COLOR: Color3 =
	new Color3(0.78, 0.78, 0.78);

/** White road center line color. */
export const ROAD_LINE_COLOR: Color3 =
	new Color3(1, 1, 1);

/** Red bumper alternating stripe color. */
export const BUMPER_RED: Color3 =
	new Color3(0.9, 0.2, 0.2);

/** White bumper alternating stripe color. */
export const BUMPER_WHITE: Color3 =
	new Color3(1, 1, 1);

/** Bubblegum pink kart color. */
export const KART_COLOR_PINK: Color3 =
	new Color3(1, 0.41, 0.71);

/** Bright red kart color. */
export const KART_COLOR_RED: Color3 =
	new Color3(0.9, 0.1, 0.1);

/** Teal blue kart color. */
export const KART_COLOR_TEAL_BLUE: Color3 =
	new Color3(0, 0.5, 0.5);

// ─── Jump Ramps ────────────────────────────────────────────────────

/** Small ramp upward velocity (3x base). */
export const JUMP_SMALL_VELOCITY: number = 24;

/** Medium ramp upward velocity (3x base). */
export const JUMP_MEDIUM_VELOCITY: number = 36;

/** Large ramp upward velocity (3x base). */
export const JUMP_LARGE_VELOCITY: number = 45;

/** Minimum kart speed (mph) required to trigger a jump. */
export const JUMP_MIN_SPEED_MPH: number = 5;

/** Small ramp surface length. */
export const RAMP_LENGTH_SMALL: number = 4;

/** Medium ramp surface length. */
export const RAMP_LENGTH_MEDIUM: number = 5;

/** Large ramp surface length. */
export const RAMP_LENGTH_LARGE: number = 6;

/** Small ramp peak height above road (3x base). */
export const RAMP_HEIGHT_SMALL: number = 3;

/** Medium ramp peak height above road (3x base). */
export const RAMP_HEIGHT_MEDIUM: number = 6;

/** Large ramp peak height above road (3x base). */
export const RAMP_HEIGHT_LARGE: number = 9;

/** Yellow ramp stripe marker color. */
export const RAMP_CHEVRON_COLOR: Color3 =
	new Color3(1, 0.85, 0);

// ─── Tunnel ────────────────────────────────────────────────────────

/** Tunnel length in world units. */
export const TUNNEL_LENGTH: number = 35;

/** Tunnel arch height in world units. */
export const TUNNEL_HEIGHT: number = 8;

/** Tunnel wall thickness. */
export const TUNNEL_WALL_THICKNESS: number = 1;

/** Spacing between tunnel lights in world units. */
export const TUNNEL_LIGHT_SPACING: number = 6;

/** Tunnel interior light intensity. */
export const TUNNEL_LIGHT_INTENSITY: number = 0.8;

/** Tunnel interior light range. */
export const TUNNEL_LIGHT_RANGE: number = 8;

/** Tunnel light glowing blue color. */
export const TUNNEL_LIGHT_COLOR: Color3 =
	new Color3(0.5, 0.7, 1.0);

/** Tunnel light emissive color for glow spheres. */
export const TUNNEL_LIGHT_EMISSIVE: Color3 =
	new Color3(0.3, 0.5, 0.9);

/** Dark stone gray tunnel wall color. */
export const TUNNEL_WALL_COLOR: Color3 =
	new Color3(0.3, 0.3, 0.35);

/** Height at which tunnel lights are mounted on walls. */
export const TUNNEL_LIGHT_HEIGHT: number = 5;

// ─── Octopus Boss ──────────────────────────────────────────────────

/** Octopus body diameter in world units. */
export const OCTOPUS_BODY_DIAMETER: number = 30;

/** Octopus body height factor (rounder for cute look). */
export const OCTOPUS_BODY_SCALE_Y: number = 0.7;

/** Number of tentacle arms on the octopus body. */
export const TENTACLE_COUNT: number = 8;

/** Decorative tentacle length in world units. */
export const TENTACLE_LENGTH: number = 35;

/** Decorative tentacle width at the base in world units. */
export const TENTACLE_WIDTH: number = 3;

/** Tentacle sway amplitude at the tip (visible cute animation). */
export const TENTACLE_SWAY_AMPLITUDE: number = 1.5;

/** Tentacle sway period in seconds. */
export const TENTACLE_SWAY_PERIOD: number = 4;

/** Number of segments per decorative tentacle. */
export const TENTACLE_SEGMENT_COUNT: number = 15;

/** Approach trigger distance before the octopus body. */
export const APPROACH_TRIGGER_DISTANCE: number = 100;

/** Fixed upward velocity for space-bar jump over the octopus. */
export const OCTOPUS_JUMP_VELOCITY: number = 55;

/** Collision radius for octopus body during jump-over. */
export const OCTOPUS_COLLISION_RADIUS: number = 14;

/** Height of the octopus jump attack in world units. */
export const OCTOPUS_JUMP_HEIGHT: number = 25;

/** Duration of the octopus jump attack in seconds. */
export const OCTOPUS_JUMP_DURATION: number = 1.5;

/** Squash/stretch deformation factor during jump blob animation. */
export const OCTOPUS_SQUASH_STRETCH_FACTOR: number = 0.3;

/** Cute pink octopus body color. */
export const OCTOPUS_BODY_COLOR: Color3 =
	new Color3(0.9, 0.5, 0.7);

/** Pink emissive glow for octopus body. */
export const OCTOPUS_EMISSIVE_COLOR: Color3 =
	new Color3(0.15, 0.05, 0.1);

/** Pink bow ribbon color. */
export const OCTOPUS_BOW_COLOR: Color3 =
	new Color3(0.95, 0.3, 0.6);

/** Lighter pink tentacle color. */
export const TENTACLE_COLOR: Color3 =
	new Color3(0.85, 0.45, 0.65);

// ─── Rescue Platform ───────────────────────────────────────────────

/** Rescue platform radius in world units. */
export const RESCUE_PLATFORM_RADIUS: number = 40;

/** Rescue platform height (at road level). */
export const RESCUE_PLATFORM_HEIGHT: number = 0.15;

/**
 * Y distance from a standing character's root node to the bottom of its feet.
 * Used to place standing characters so their feet land exactly on a surface.
 */
export const CHARACTER_STANDING_FOOT_OFFSET: number = 0.60;

/** Distance behind the octopus body where the rescue platform spawns. */
export const RESCUE_PLATFORM_OFFSET_Z: number = 600;

/** Distance past the last track segment where the octopus body spawns. */
export const OCTOPUS_SPAWN_OFFSET_Z: number = 50;

/** Rescue zone trigger radius for auto-braking. */
export const RESCUE_ZONE_RADIUS: number = 45;

/** Warm marble white platform color. */
export const RESCUE_PLATFORM_COLOR: Color3 =
	new Color3(0.95, 0.9, 0.85);

/** Gold ring edge color. */
export const RESCUE_RING_COLOR: Color3 =
	new Color3(0.85, 0.75, 0.3);

/** Gold emissive glow for the platform. */
export const RESCUE_EMISSIVE_COLOR: Color3 =
	new Color3(0.15, 0.12, 0.05);

// ─── Castle ────────────────────────────────────────────────────────

/** Castle tower height in world units. */
export const CASTLE_TOWER_HEIGHT: number = 40;

/** Castle main wall width. */
export const CASTLE_WALL_WIDTH: number = 50;

/** Castle main wall height. */
export const CASTLE_WALL_HEIGHT: number = 25;

/** Castle offset Z behind rescue platform. */
export const CASTLE_OFFSET_Z: number = 60;

/** Castle stone wall color. */
export const CASTLE_WALL_COLOR: Color3 =
	new Color3(0.75, 0.72, 0.68);

/** Castle tower top color (darker stone). */
export const CASTLE_TOWER_COLOR: Color3 =
	new Color3(0.6, 0.58, 0.55);

/** Castle flag color (royal blue). */
export const CASTLE_FLAG_COLOR: Color3 =
	new Color3(0.2, 0.3, 0.8);

// ─── Coins ─────────────────────────────────────────────────────────

/** Number of coins placed along the track. */
export const COIN_COUNT: number = 25;

/** Coin diameter (half character size). */
export const COIN_DIAMETER: number = 1.5;

/** Coin rotation speed in radians per second. */
export const COIN_ROTATION_SPEED: number = 2;

/** Coin floating height above road. */
export const COIN_FLOAT_HEIGHT: number = 1.5;

/** Coin collection trigger radius. */
export const COIN_COLLECT_RADIUS: number = 2;

/** Gold coin color. */
export const COIN_COLOR: Color3 =
	new Color3(1, 0.84, 0);

/** Coin emissive glow. */
export const COIN_EMISSIVE_COLOR: Color3 =
	new Color3(0.3, 0.25, 0);

// ─── Boost Pads ────────────────────────────────────────────────────

/** Number of boost pads on the track. */
export const BOOST_PAD_COUNT: number = 20;

/** Extra mph added per boost pad collected (cumulative). */
export const BOOST_INCREMENT_MPH: number = 10;

/** Boost pad surface length. */
export const BOOST_PAD_LENGTH: number = 8;

/** Boost pad width (slightly narrower than road). */
export const BOOST_PAD_WIDTH: number = 14;

/** Boost pad trigger radius. */
export const BOOST_TRIGGER_RADIUS: number = 10;

/** Boost pad blue color. */
export const BOOST_PAD_COLOR: Color3 =
	new Color3(0, 0.6, 1);

/** Boost pad emissive glow. */
export const BOOST_PAD_EMISSIVE: Color3 =
	new Color3(0, 0.3, 0.6);

/** Boost arrow chevron color (white). */
export const BOOST_CHEVRON_COLOR: Color3 =
	new Color3(1, 1, 1);

// ─── Landing Road ──────────────────────────────────────────────────

/** Landing road length after octopus (world units). */
export const LANDING_ROAD_LENGTH: number = 700;

/** Landing road width (same as main road). */
export const LANDING_ROAD_WIDTH: number = 30;

/** Final approach road width at the octopus end (extra wide). */
export const APPROACH_ROAD_END_WIDTH: number = 60;

// ─── Victory ───────────────────────────────────────────────────────

/** Deceleration rate multiplier during victory state. */
export const VICTORY_DECEL_RATE: number = 5;

/** Heading turn speed in radians per second during victory. */
export const VICTORY_TURN_RATE: number = 3;

/** Number of approach road transition segments. */
export const APPROACH_ROAD_STEPS: number = 10;

// ─── Rolling Hills ─────────────────────────────────────────────────

/** Number of hills along the track. */
export const HILL_COUNT: number = 5;

/** Minimum hill peak height in world units. */
export const HILL_MIN_HEIGHT: number = 3;

/** Maximum hill peak height in world units. */
export const HILL_MAX_HEIGHT: number = 8;

/** Minimum hill length in segments. */
export const HILL_MIN_LENGTH: number = 8;

/** Maximum hill length in segments. */
export const HILL_MAX_LENGTH: number = 16;