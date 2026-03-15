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
} from "@sandbox/car-a-lot/constants/car-a-lot.constants";

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
export class RaceCameraService
{
	private camera: FreeCamera | null = null;

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

		const behindOffset: Vector3 =
			new Vector3(
				-Math.sin(kartHeading) * CAMERA_DISTANCE_BACK,
				targetHeight,
				-Math.cos(kartHeading) * CAMERA_DISTANCE_BACK);

		const targetPos: Vector3 =
			kartPosition.add(behindOffset);

		const lerpFactor: number =
			Math.min(1, deltaTime * LERP_SPEED);

		this.camera.position =
			Vector3.Lerp(
				this.camera.position,
				targetPos,
				lerpFactor);

		const lookAhead: Vector3 =
			new Vector3(
				Math.sin(kartHeading) * LOOK_AHEAD_DISTANCE,
				LOOK_AHEAD_HEIGHT,
				Math.cos(kartHeading) * LOOK_AHEAD_DISTANCE);

		this.camera.setTarget(
			kartPosition.add(lookAhead));
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