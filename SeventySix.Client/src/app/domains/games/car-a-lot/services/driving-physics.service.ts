/**
 * Driving Physics Service.
 * Core physics engine for acceleration, steering, gravity, and jumps.
 */

import { Injectable } from "@angular/core";
import {
	BUMPER_MAX_HEADING_CHANGE,
	BUMPER_SPEED_RETENTION,
	GRAVITY,
	KART_GROUND_OFFSET,
	MAX_SPEED_MPH,
	TURN_SPEED
} from "@games/car-a-lot/constants/car-a-lot.constants";
import { DrivingState } from "@games/car-a-lot/models/car-a-lot.models";
import type { IGamePhysicsService } from "@games/shared/models/game-service.interfaces";

/** Conversion factor from mph to meters per second. */
const MPH_TO_MPS: number = 0.44704;

/** Maximum speed in meters per second. */
const MAX_SPEED_MPS: number =
	MAX_SPEED_MPH * MPH_TO_MPS;

/** Acceleration rate (reach max in ~3 seconds). */
const ACCELERATION: number =
	MAX_SPEED_MPS / 3;

/** Friction deceleration rate (coast to stop in ~6 seconds). */
const FRICTION_DECEL: number =
	MAX_SPEED_MPS / 6;

/** Minimum speed required to steer (m/s). */
const MIN_TURN_SPEED: number = 0.1;

/** Maximum deltaTime cap to prevent physics explosions. */
const DELTA_TIME_CAP: number = 0.1;

/**
 * Core driving physics engine.
 * Handles acceleration, steering, gravity, and jump mechanics.
 */
@Injectable()
export class DrivingPhysicsService implements IGamePhysicsService
{
	private currentSpeedMps: number = 0;
	private headingRadians: number = 0;
	private positionX: number = 0;
	private positionY: number = KART_GROUND_OFFSET;
	private positionZ: number = 0;
	private verticalVelocity: number = 0;
	private grounded: boolean = true;

	/** Temporary max speed override for boost pads. */
	private temporaryMaxSpeedMps: number | null = null;

	/**
	 * Updates driving physics for one frame.
	 * @param keys - Current keyboard state from InputService.
	 * @param deltaTime - Time since last frame in seconds.
	 * @param groundHeight - Ground height at current XZ position.
	 * @returns Complete DrivingState snapshot.
	 */
	update(
		keys: Record<string, boolean>,
		deltaTime: number,
		groundHeight: number): DrivingState
	{
		const cappedDelta: number =
			Math.min(deltaTime, DELTA_TIME_CAP);

		this.updateSpeed(keys, cappedDelta);
		this.updateSteering(keys, cappedDelta);
		this.updatePosition(cappedDelta);
		this.updateGravity(cappedDelta, groundHeight);

		return {
			speedMph: this.currentSpeedMps / MPH_TO_MPS,
			positionX: this.positionX,
			positionY: this.positionY,
			positionZ: this.positionZ,
			rotationY: this.headingRadians,
			isGrounded: this.grounded,
			isOnRoad: true,
			currentLap: 1
		};
	}

	/**
	 * Applies a jump impulse.
	 * @param verticalForce - Upward velocity to apply.
	 */
	applyJump(verticalForce: number): void
	{
		if (this.grounded)
		{
			this.verticalVelocity = verticalForce;
			this.grounded = false;
		}
	}

	/**
	 * Applies a hard bounce deflection from a bumper wall collision.
	 * Pushes heading away from the wall and retains most speed.
	 * @param bounceHeading - Normal angle pointing away from bumper (radians).
	 * @param _force - Unused — wall physics uses constants for retention.
	 */
	applyBounce(
		bounceHeading: number,
		_force: number): void
	{
		const headingDiff: number =
			bounceHeading - this.headingRadians;
		const normalizedDiff: number =
			Math.atan2(
				Math.sin(headingDiff),
				Math.cos(headingDiff));

		const clampedChange: number =
			Math.max(
				-BUMPER_MAX_HEADING_CHANGE,
				Math.min(BUMPER_MAX_HEADING_CHANGE, normalizedDiff));

		this.headingRadians += clampedChange;
		this.currentSpeedMps *= BUMPER_SPEED_RETENTION;
	}

	/**
	 * Pushes the kart position inward from a road edge to prevent going off-road.
	 * @param pushX - World X push vector component.
	 * @param pushZ - World Z push vector component.
	 */
	clampToRoad(
		pushX: number,
		pushZ: number): void
	{
		this.positionX += pushX;
		this.positionZ += pushZ;
	}

	/**
	 * Reduces current speed by a multiplier (0–1).
	 * @param multiplier - Speed retention factor (0.7 = keep 70% of speed).
	 */
	reduceSpeed(multiplier: number): void
	{
		this.currentSpeedMps *= multiplier;
	}

	/**
	 * Sets a maximum speed cap for auto-braking during rescue approach.
	 * @param maxMps - Maximum speed in meters per second.
	 */
	setMaxSpeed(maxMps: number): void
	{
		if (this.currentSpeedMps > maxMps)
		{
			this.currentSpeedMps = maxMps;
		}
	}

	/**
	 * Gets the current speed in meters per second.
	 * @returns Current speed in m/s.
	 */
	getCurrentSpeedMps(): number
	{
		return this.currentSpeedMps;
	}

	/**
	 * Sets a temporary max speed override for boost pads.
	 * @param maxMph - Temporary maximum speed in mph.
	 */
	setTemporaryMaxSpeed(maxMph: number): void
	{
		this.temporaryMaxSpeedMps =
			maxMph * MPH_TO_MPS;
	}

	/**
	 * Clears the temporary max speed override.
	 */
	clearTemporaryMaxSpeed(): void
	{
		this.temporaryMaxSpeedMps = null;
	}

	/**
	 * Gets the effective maximum speed in m/s, considering boost.
	 * @returns Effective max speed in m/s.
	 */
	getEffectiveMaxSpeedMps(): number
	{
		return this.temporaryMaxSpeedMps ?? MAX_SPEED_MPS;
	}

	/**
	 * Sets the kart heading directly.
	 * @param radians - New heading angle in radians.
	 */
	setHeading(radians: number): void
	{
		this.headingRadians = radians;
	}

	/**
	 * Ensures the kart has at least the given forward speed.
	 * @param minMps - Minimum speed in meters per second.
	 */
	ensureMinSpeed(minMps: number): void
	{
		if (this.currentSpeedMps < minMps)
		{
			this.currentSpeedMps = minMps;
		}
	}

	/**
	 * Resets all physics state to initial values.
	 */
	reset(): void
	{
		this.currentSpeedMps = 0;
		this.headingRadians = 0;
		this.positionX = 0;
		this.positionY = KART_GROUND_OFFSET;
		this.positionZ = 0;
		this.verticalVelocity = 0;
		this.grounded = true;
		this.temporaryMaxSpeedMps = null;
	}

	/**
	 * Updates speed based on acceleration or friction.
	 * @param keys - Current keyboard state.
	 * @param deltaTime - Capped frame delta time.
	 */
	private updateSpeed(
		keys: Record<string, boolean>,
		deltaTime: number): void
	{
		const isAccelerating: boolean =
			keys["w"] === true
				|| keys["W"] === true
				|| keys["ArrowUp"] === true;

		if (isAccelerating)
		{
			this.currentSpeedMps += ACCELERATION * deltaTime;
			const effectiveMax: number =
				this.getEffectiveMaxSpeedMps();
			this.currentSpeedMps =
				Math.min(this.currentSpeedMps, effectiveMax);
		}
		else if (this.currentSpeedMps > 0)
		{
			this.currentSpeedMps -= FRICTION_DECEL * deltaTime;
			this.currentSpeedMps =
				Math.max(this.currentSpeedMps, 0);
		}
	}

	/**
	 * Updates heading based on steering input and current speed.
	 * @param keys - Current keyboard state.
	 * @param deltaTime - Capped frame delta time.
	 */
	private updateSteering(
		keys: Record<string, boolean>,
		deltaTime: number): void
	{
		if (this.currentSpeedMps <= MIN_TURN_SPEED)
		{
			return;
		}

		const isTurningLeft: boolean =
			keys["a"] === true
				|| keys["A"] === true
				|| keys["ArrowLeft"] === true;
		const isTurningRight: boolean =
			keys["d"] === true
				|| keys["D"] === true
				|| keys["ArrowRight"] === true;

		const speedRatio: number =
			this.currentSpeedMps / MAX_SPEED_MPS;

		if (isTurningLeft)
		{
			this.headingRadians -= TURN_SPEED * speedRatio * deltaTime;
		}

		if (isTurningRight)
		{
			this.headingRadians += TURN_SPEED * speedRatio * deltaTime;
		}
	}

	/**
	 * Updates XZ position based on speed and heading.
	 * @param deltaTime - Capped frame delta time.
	 */
	private updatePosition(deltaTime: number): void
	{
		this.positionX += Math.sin(this.headingRadians) * this.currentSpeedMps * deltaTime;
		this.positionZ += Math.cos(this.headingRadians) * this.currentSpeedMps * deltaTime;
	}

	/**
	 * Updates vertical position with gravity and ground detection.
	 * @param deltaTime - Capped frame delta time.
	 * @param groundHeight - Ground height at current position.
	 */
	private updateGravity(
		deltaTime: number,
		groundHeight: number): void
	{
		if (!this.grounded)
		{
			this.verticalVelocity += GRAVITY * deltaTime;
			this.positionY += this.verticalVelocity * deltaTime;

			if (this.positionY <= groundHeight + KART_GROUND_OFFSET)
			{
				this.positionY =
					groundHeight + KART_GROUND_OFFSET;
				this.verticalVelocity = 0;
				this.grounded = true;
			}
		}
		else
		{
			this.positionY =
				groundHeight + KART_GROUND_OFFSET;
		}
	}
}