/**
 * Shared game service interfaces.
 * Defines contracts for game service lifecycle, audio, camera, physics, and scene services.
 * All games SHOULD implement relevant interfaces to ensure consistent patterns.
 */

import type { Scene } from "@babylonjs/core/scene";

/**
 * Lifecycle interface for any game service that needs cleanup.
 * Services implementing this can be registered with DisposableRegistryService
 * for automated batch disposal.
 */
export interface IDisposable
{
	/** Release all resources (meshes, observers, audio nodes, etc.). */
	dispose(): void;
}

/**
 * Contract for game audio services.
 * Provides initialization, mute toggle, and cleanup for audio systems.
 */
export interface IGameAudioService extends IDisposable
{
	/** Initialize the audio context and gain nodes. */
	initialize(): void;

	/** Whether audio is currently muted. */
	readonly isMuted: boolean;

	/** Toggle mute state. */
	toggleMute(): void;
}

/**
 * Contract for game camera services.
 * Manages camera setup and lifecycle for a Babylon.js scene.
 */
export interface IGameCameraService extends IDisposable
{
	/**
	 * Set up the camera on the given scene.
	 * @param scene
	 * The Babylon.js scene to attach the camera to.
	 */
	initialize(scene: Scene): void;
}

/**
 * Contract for game physics services.
 * Manages physics state and per-frame updates.
 */
export interface IGamePhysicsService
{
	/** Reset physics state to initial values. */
	reset(): void;
}

/**
 * Contract for game scene setup services.
 * Manages environment construction (ground, lighting, skybox, etc.).
 */
export interface IGameSceneService extends IDisposable
{
	/**
	 * Build the scene environment.
	 * @param scene
	 * The Babylon.js scene to construct the environment in.
	 */
	initialize(scene: Scene): void;
}