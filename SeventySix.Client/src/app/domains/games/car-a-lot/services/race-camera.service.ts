/**
 * Race Camera Service.
 * Manages the chase camera that follows the kart with smooth lerping.
 */

import { Injectable } from "@angular/core";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import {
	CAMERA_DISTANCE_BACK,
	CAMERA_HEIGHT,
	TUNNEL_HEIGHT
} from "@games/car-a-lot/constants/car-a-lot.constants";
import type { IGameCameraService } from "@games/shared/models/game-service.interfaces";

/** Lerp smoothing factor multiplier for camera follow. */
const LERP_SPEED: number = 4;

/** Look-ahead distance in front of kart. */
const LOOK_AHEAD_DISTANCE: number = 5;

/** Look-ahead height offset. */
const LOOK_AHEAD_HEIGHT: number = 2;

/**
 * Chase camera that smoothly follows the kart from behind and above.
 */
@Injectable()
export class RaceCameraService implements IGameCameraService
{
	private camera: FreeCamera | null = null;

	/** Pre-allocated offset behind the kart for camera positioning. */
	private readonly _behindOffset: Vector3 =
		Vector3.Zero();

	/** Pre-allocated target position for camera lerp. */
	private readonly _targetPos: Vector3 =
		Vector3.Zero();

	/** Pre-allocated look-ahead direction for camera target. */
	private readonly _lookAhead: Vector3 =
		Vector3.Zero();

	/**
	 * Creates and initializes the chase camera in the scene.
	 * @param scene - Babylon.js scene to create the camera in.
	 */
	initialize(scene: Scene): void
	{
		this.camera =
			new FreeCamera(
				"race-camera",
				new Vector3(0, CAMERA_HEIGHT, -CAMERA_DISTANCE_BACK),
				scene);

		this.camera.setTarget(Vector3.Zero());
		scene.activeCamera =
			this.camera;
	}

	/**
	 * Updates camera position to smoothly follow the kart.
	 * @param kartPosition - Current kart world position.
	 * @param kartHeading - Current kart heading in radians.
	 * @param deltaTime - Frame delta time in seconds.
	 * @param isInTunnel - Whether the kart is currently inside a tunnel.
	 */
	updateCamera(
		kartPosition: Vector3,
		kartHeading: number,
		deltaTime: number,
		isInTunnel: boolean = false): void
	{
		if (this.camera == null)
		{
			return;
		}

		const targetHeight: number =
			isInTunnel
				? TUNNEL_HEIGHT - 2
				: CAMERA_HEIGHT;

		this._behindOffset.copyFromFloats(
			-Math.sin(kartHeading) * CAMERA_DISTANCE_BACK,
			targetHeight,
			-Math.cos(kartHeading) * CAMERA_DISTANCE_BACK);

		kartPosition.addToRef(this._behindOffset, this._targetPos);

		const lerpFactor: number =
			Math.min(1, deltaTime * LERP_SPEED);

		Vector3.LerpToRef(
			this.camera.position,
			this._targetPos,
			lerpFactor,
			this.camera.position);

		this._lookAhead.copyFromFloats(
			Math.sin(kartHeading) * LOOK_AHEAD_DISTANCE,
			LOOK_AHEAD_HEIGHT,
			Math.cos(kartHeading) * LOOK_AHEAD_DISTANCE);

		kartPosition.addToRef(this._lookAhead, this._lookAhead);
		this.camera.setTarget(this._lookAhead);
	}

	/**
	 * Disposes the camera and clears references.
	 */
	dispose(): void
	{
		if (this.camera != null)
		{
			this.camera.dispose();
			this.camera = null;
		}
	}
}