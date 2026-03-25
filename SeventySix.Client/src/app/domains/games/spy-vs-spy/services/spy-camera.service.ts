// <copyright file="spy-camera.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy Camera Service.
 * Manages the follow-camera for the Spy vs Spy game.
 * Single Responsibility: camera positioning and target tracking.
 */

import { Injectable } from "@angular/core";
import { Animation } from "@babylonjs/core/Animations/animation";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import {
	CAMERA_HEIGHT,
	CAMERA_PITCH_DEGREES,
	CAMERA_TARGET_Y_OFFSET
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";

/**
 * Follow camera for the active spy.
 * Domain-scoped — provided via route `providers` array.
 */
@Injectable()
export class SpyCameraService
{
	/** Camera instance reference. */
	private camera: ArcRotateCamera | null = null;

	/** Scene reference for animations. */
	private sceneRef: Scene | null = null;

	/** Per-frame chase observer tracking the airplane. */
	private chaseObserver: ReturnType<typeof Scene.prototype.onBeforeRenderObservable.add> | null = null;

	/** Zoom-out height for full island view during explosion. */
	private static readonly ZOOM_OUT_HEIGHT: number = 60;

	/** Camera pan animation frames per second. */
	private static readonly ANIMATION_FPS: number = 30;

	/** Camera pan animation duration in frames. */
	private static readonly PAN_FRAMES: number = 60;

	/** Vertical offset above airplane for chase camera. */
	private static readonly CHASE_CAMERA_Y_OFFSET: number = 8;

	/** Horizontal offset behind airplane for chase camera. */
	private static readonly CHASE_CAMERA_BEHIND_OFFSET: number = 12;

	/**
	 * Create and attach the ArcRotateCamera targeting a spy.
	 * @param scene
	 * The Babylon.js Scene to create the camera in.
	 * @param target
	 * The initial spy TransformNode to follow.
	 */
	initialize(scene: Scene, target?: TransformNode): void
	{
		this.sceneRef = scene;

		const beta: number =
			CAMERA_PITCH_DEGREES * Math.PI / 180;

		const initialTarget: Vector3 =
			target != null
				? target.position.clone()
				: Vector3.Zero();

		initialTarget.y =
			CAMERA_TARGET_Y_OFFSET;

		this.camera =
			new ArcRotateCamera(
				"spy-camera",
				-Math.PI / 2,
				beta,
				CAMERA_HEIGHT,
				initialTarget,
				scene);

		this.camera.inputs.clear();
		scene.activeCamera =
			this.camera;
	}

	/**
	 * Update camera target to follow active spy position.
	 * @param spyNode
	 * The TransformNode of the spy to track.
	 */
	updateTarget(spyNode: TransformNode): void
	{
		if (this.camera != null)
		{
			this.camera.target.copyFrom(
				spyNode.position);
			this.camera.target.y =
				spyNode.position.y + CAMERA_TARGET_Y_OFFSET;
		}
	}

	/**
	 * Focus camera on the airplane for takeoff chase sequence.
	 * Animates camera to a position behind (negative X) and above the airplane.
	 * @param target
	 * The airplane TransformNode to follow.
	 */
	focusOnAirplane(target: TransformNode): void
	{
		if (this.camera == null || this.sceneRef == null)
		{
			return;
		}

		const targetPos: Vector3 =
			target.position.clone();

		this.camera.target.copyFrom(targetPos);

		const endPosition: Vector3 =
			new Vector3(
				targetPos.x - SpyCameraService.CHASE_CAMERA_BEHIND_OFFSET,
				targetPos.y + SpyCameraService.CHASE_CAMERA_Y_OFFSET,
				targetPos.z);

		const positionAnimation: Animation =
			new Animation(
				"cameraFocusPosition",
				"position",
				SpyCameraService.ANIMATION_FPS,
				Animation.ANIMATIONTYPE_VECTOR3,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		positionAnimation.setKeys(
			[
				{ frame: 0, value: this.camera.position.clone() },
				{ frame: SpyCameraService.PAN_FRAMES, value: endPosition }
			]);

		this.sceneRef.beginDirectAnimation(
			this.camera,
			[positionAnimation],
			0,
			SpyCameraService.PAN_FRAMES,
			false,
			1);
	}

	/**
	 * Attaches the camera to follow the airplane each frame during takeoff.
	 * Provides a chase-cam (spy's POV) effect — camera stays behind and above.
	 * @param target
	 * The airplane TransformNode to follow per-frame.
	 */
	attachToAirplane(target: TransformNode): void
	{
		if (this.camera == null || this.sceneRef == null)
		{
			return;
		}

		const cam: ArcRotateCamera =
			this.camera;

		this.chaseObserver =
			this.sceneRef.onBeforeRenderObservable.add(
				() =>
				{
					cam.position.x =
						target.position.x - SpyCameraService.CHASE_CAMERA_BEHIND_OFFSET;
					cam.position.y =
						target.position.y + SpyCameraService.CHASE_CAMERA_Y_OFFSET;
					cam.position.z =
						target.position.z;
					cam.target.copyFrom(target.position);
				});
	}

	/**
	 * Detaches the per-frame chase camera observer.
	 */
	detachFromAirplane(): void
	{
		if (this.chaseObserver != null && this.sceneRef != null)
		{
			this.sceneRef.onBeforeRenderObservable.remove(this.chaseObserver);
			this.chaseObserver = null;
		}
	}

	/**
	 * Pan camera smoothly toward the island center.
	 * Used after airplane leaves the island to show the explosion.
	 * @param islandCenter
	 * The Vector3 position of the island center to pan toward.
	 * @param onComplete
	 * Callback invoked when the pan animation finishes.
	 */
	panToIsland(islandCenter: Vector3, onComplete: () => void): void
	{
		if (this.camera == null || this.sceneRef == null)
		{
			return;
		}

		const targetAnimation: Animation =
			new Animation(
				"cameraPanTarget",
				"target",
				SpyCameraService.ANIMATION_FPS,
				Animation.ANIMATIONTYPE_VECTOR3,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		targetAnimation.setKeys(
			[
				{ frame: 0, value: this.camera.target.clone() },
				{ frame: SpyCameraService.PAN_FRAMES, value: islandCenter.clone() }
			]);

		this.sceneRef.beginDirectAnimation(
			this.camera,
			[targetAnimation],
			0,
			SpyCameraService.PAN_FRAMES,
			false,
			1,
			onComplete);
	}

	/**
	 * Zoom out to show the full island before the explosion.
	 * Animates both target (toward island center) and radius (zooming out).
	 * @param islandCenter
	 * The Vector3 position of the island center.
	 * @param onComplete
	 * Callback invoked when the zoom-out animation finishes.
	 */
	zoomOutToIslandView(islandCenter: Vector3, onComplete: () => void): void
	{
		if (this.camera == null || this.sceneRef == null)
		{
			return;
		}

		const targetAnimation: Animation =
			new Animation(
				"cameraZoomTarget",
				"target",
				SpyCameraService.ANIMATION_FPS,
				Animation.ANIMATIONTYPE_VECTOR3,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		targetAnimation.setKeys(
			[
				{ frame: 0, value: this.camera.target.clone() },
				{ frame: SpyCameraService.PAN_FRAMES, value: islandCenter.clone() }
			]);

		const radiusAnimation: Animation =
			new Animation(
				"cameraZoomRadius",
				"radius",
				SpyCameraService.ANIMATION_FPS,
				Animation.ANIMATIONTYPE_FLOAT,
				Animation.ANIMATIONLOOPMODE_CONSTANT);

		radiusAnimation.setKeys(
			[
				{ frame: 0, value: this.camera.radius },
				{ frame: SpyCameraService.PAN_FRAMES, value: SpyCameraService.ZOOM_OUT_HEIGHT }
			]);

		this.sceneRef.beginDirectAnimation(
			this.camera,
			[targetAnimation, radiusAnimation],
			0,
			SpyCameraService.PAN_FRAMES,
			false,
			1,
			onComplete);
	}

	/**
	 * Dispose the camera and clear references.
	 */
	dispose(): void
	{
		this.detachFromAirplane();

		if (this.camera != null)
		{
			this.camera.dispose();
			this.camera = null;
		}

		this.sceneRef = null;
	}
}