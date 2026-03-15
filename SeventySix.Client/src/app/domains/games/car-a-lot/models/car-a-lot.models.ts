/**
 * Car-a-Lot game model definitions.
 * Enums, interfaces, and types for the driving game.
 */

/**
 * Available kart body color options.
 */
export enum KartColor
{
	/** Bubblegum pink. */
	Pink = "Pink",

	/** Bright red. */
	Red = "Red",

	/** Teal blue. */
	TealBlue = "TealBlue"
}

/**
 * Available character types for the driver.
 */
export enum CharacterType
{
	/** LEGO princess character. */
	Princess = "Princess",

	/** LEGO prince character. */
	Prince = "Prince"
}

/**
 * Race lifecycle state machine states.
 */
export enum RaceState
{
	/** Countdown before race start (3-2-1-GO). */
	Countdown = "Countdown",

	/** Active driving phase. */
	Racing = "Racing",

	/** Approaching or engaging the octopus boss. */
	OctopusPhase = "OctopusPhase",

	/** Driving to the victory circle. */
	Rescue = "Rescue",

	/** Octopus is jumping on the player after missed tentacle. */
	OctopusAttack = "OctopusAttack",

	/** Prince/princess rescued — game complete. */
	Victory = "Victory",

	/** Player missed the landing — game over. */
	GameOver = "GameOver"
}

/**
 * Snapshot of the kart's current driving state.
 */
export interface DrivingState
{
	/** Current speed in miles per hour. */
	speedMph: number;

	/** World X-axis position. */
	positionX: number;

	/** World Y-axis position. */
	positionY: number;

	/** World Z-axis position. */
	positionZ: number;

	/** Y-axis heading rotation in radians. */
	rotationY: number;

	/** Whether the kart is touching the ground. */
	isGrounded: boolean;

	/** Whether the kart is on the road surface. */
	isOnRoad: boolean;

	/** Current lap number. */
	currentLap: number;
}

/**
 * Track segment classification for road building.
 */
export enum TrackSegmentType
{
	/** Straight road section. */
	Straight = "Straight",

	/** Left-turning curve. */
	CurveLeft = "CurveLeft",

	/** Right-turning curve. */
	CurveRight = "CurveRight",

	/** Fork splitting into two paths. */
	Fork = "Fork",

	/** Enclosed tunnel with interior lights. */
	Tunnel = "Tunnel",

	/** Ramp jump section. */
	Jump = "Jump",

	/** Octopus boss arena. */
	OctopusArena = "OctopusArena"
}

/**
 * Road segment definition used for collision detection.
 */
export interface RoadSegment
{
	/** World X position of segment center. */
	positionX: number;

	/** World Z position of segment center. */
	positionZ: number;

	/** Segment length in world units. */
	length: number;

	/** Y-axis rotation in radians. */
	rotationY: number;

	/** Whether this segment is part of a fork. */
	isFork: boolean;

	/** Hill elevation Y offset above base road level. */
	elevation: number;
}

/**
 * Result of a road boundary check for collision detection.
 */
export interface RoadBoundaryResult
{
	/** Whether the position is within the drivable road area. */
	isOnRoad: boolean;

	/** Whether the position is in the bumper collision zone. */
	isInBumperZone: boolean;

	/** Normal angle pointing away from the bumper (radians). */
	bumperNormalAngle: number;

	/** Distance to the nearest road edge. */
	distanceToEdge: number;

	/** Index of the nearest road segment. */
	segmentIndex: number;

	/** Ground elevation at the nearest road segment. */
	groundElevation: number;
}

/**
 * Jump ramp size classification.
 */
export type JumpRampSize = "small" | "medium" | "large";

/**
 * Jump ramp definition with position, size, and trigger zone.
 */
export interface JumpRamp
{
	/** Ramp size classification. */
	size: JumpRampSize;

	/** World X position of the ramp center. */
	positionX: number;

	/** World Z position of the ramp center. */
	positionZ: number;

	/** Y-axis heading of the ramp in radians. */
	rotationY: number;

	/** Upward velocity applied when jumping. */
	jumpVelocity: number;

	/** Minimum speed (mph) required to trigger the jump. */
	minimumSpeedMph: number;

	/** Ramp surface length along the road. */
	rampLength: number;
}

/**
 * Result of a jump trigger check for a kart position.
 */
export interface JumpResult
{
	/** Upward velocity to apply via DrivingPhysicsService.applyJump(). */
	jumpVelocity: number;

	/** Index of the ramp that triggered. */
	rampIndex: number;
}

/**
 * Coin placed on the track for collection.
 */
export interface TrackCoin
{
	/** World X position. */
	positionX: number;

	/** World Z position. */
	positionZ: number;

	/** Whether this coin has been collected. */
	collected: boolean;

	/** Reference index for the mesh array. */
	meshIndex: number;
}

/**
 * Boost pad placed on track for speed increase.
 */
export interface BoostPad
{
	/** World X position. */
	positionX: number;

	/** World Z position. */
	positionZ: number;

	/** Heading angle of the pad in radians. */
	rotationY: number;

	/** Trigger detection radius. */
	triggerRadius: number;
}

/**
 * Active boost state tracking.
 */
export interface BoostState
{
	/** Whether a boost is currently active. */
	isActive: boolean;

	/** Remaining boost time in seconds. */
	remainingSeconds: number;
}