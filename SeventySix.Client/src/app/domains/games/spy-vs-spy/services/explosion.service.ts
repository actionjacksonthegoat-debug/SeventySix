// <copyright file="explosion.service.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { inject, Injectable } from "@angular/core";

import "@babylonjs/core/Particles/particleSystemComponent";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ParticleSystem } from "@babylonjs/core/Particles/particleSystem";
import type { Scene } from "@babylonjs/core/scene";
import type { Nullable } from "@babylonjs/core/types";

import {
	EXPLOSION_DEBRIS_PARTICLE_COUNT,
	EXPLOSION_DURATION_SECONDS,
	EXPLOSION_FIRE_PARTICLE_COUNT,
	EXPLOSION_SMOKE_PARTICLE_COUNT
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";
import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Manages island explosion visual and audio effects.
 *
 * Creates fire, debris, and smoke particle systems
 * to simulate the island exploding after takeoff or timer expiry.
 */
@Injectable()
export class ExplosionService
{
	private readonly audioService: SpyAudioService =
		inject(SpyAudioService);

	private sceneRef: Nullable<Scene> = null;

	private particleSystems: ParticleSystem[] = [];

	private completionTimer: ReturnType<typeof setTimeout> | undefined = undefined;

	/**
	 * Stores a reference to the active Babylon.js scene.
	 * @param scene - The scene to attach particle systems to.
	 */
	public initialize(scene: Scene): void
	{
		this.sceneRef = scene;
	}

	/**
	 * Triggers the full island explosion sequence.
	 *
	 * Creates fire burst, debris, and smoke particle systems
	 * at the given center. Calls onComplete after the explosion duration.
	 * @param center - World-space position for the explosion origin.
	 * @param onComplete - Callback invoked when the explosion finishes.
	 */
	public explodeIsland(center: Vector3, onComplete: () => void): void
	{
		if (isNullOrUndefined(this.sceneRef))
		{
			return;
		}

		const scene: Scene =
			this.sceneRef;

		this.audioService.playExplosionBoom();

		this.createFireBurst(scene, center);
		this.createDebris(scene, center);
		this.createSmokePlume(scene, center);

		this.completionTimer =
			setTimeout(
				() =>
				{
					onComplete();
				},
				EXPLOSION_DURATION_SECONDS * 1000);
	}

	/**
	 * Disposes all particle systems and clears the completion timer.
	 */
	public dispose(): void
	{
		if (this.completionTimer !== undefined)
		{
			clearTimeout(this.completionTimer);
			this.completionTimer = undefined;
		}

		for (const particleSystem of this.particleSystems)
		{
			particleSystem.dispose();
		}
		this.particleSystems = [];

		this.sceneRef = null;
	}

	/**
	 * Creates the initial fire burst particle system.
	 * @param scene - The active Babylon.js scene.
	 * @param center - Explosion origin point.
	 */
	private createFireBurst(scene: Scene, center: Vector3): void
	{
		const fire: ParticleSystem =
			new ParticleSystem(
				"explosionFire",
				EXPLOSION_FIRE_PARTICLE_COUNT,
				scene);

		fire.emitter =
			center.clone();
		fire.particleTexture =
			new Texture(
				"assets/babylonjs/textures/flare.png",
				scene);

		fire.color1 =
			new Color4(1.0, 0.6, 0.0, 1.0);
		fire.color2 =
			new Color4(1.0, 0.2, 0.0, 1.0);
		fire.colorDead =
			new Color4(0.2, 0.0, 0.0, 0.0);

		fire.minSize = 1.2;
		fire.maxSize = 4.8;
		fire.minLifeTime = 0.6;
		fire.maxLifeTime = 1.8;

		fire.emitRate =
			EXPLOSION_FIRE_PARTICLE_COUNT;
		fire.direction1 =
			new Vector3(-12, 18, -12);
		fire.direction2 =
			new Vector3(12, 24, 12);
		fire.minEmitPower = 7;
		fire.maxEmitPower = 16;

		fire.targetStopDuration = 2.4;

		fire.start();
		this.particleSystems.push(fire);
	}

	/**
	 * Creates debris particles thrown outward from the explosion.
	 * @param scene - The active Babylon.js scene.
	 * @param center - Explosion origin point.
	 */
	private createDebris(scene: Scene, center: Vector3): void
	{
		const debris: ParticleSystem =
			new ParticleSystem(
				"explosionDebris",
				EXPLOSION_DEBRIS_PARTICLE_COUNT,
				scene);

		debris.emitter =
			center.clone();
		debris.particleTexture =
			new Texture(
				"assets/babylonjs/textures/flare.png",
				scene);

		debris.color1 =
			new Color4(0.5, 0.35, 0.2, 1.0);
		debris.color2 =
			new Color4(0.4, 0.4, 0.4, 1.0);
		debris.colorDead =
			new Color4(0.2, 0.2, 0.2, 0.0);

		debris.minSize = 0.4;
		debris.maxSize = 2.0;
		debris.minLifeTime = 1.2;
		debris.maxLifeTime = 4.2;

		debris.emitRate =
			EXPLOSION_DEBRIS_PARTICLE_COUNT;
		debris.direction1 =
			new Vector3(-18, 8, -18);
		debris.direction2 =
			new Vector3(18, 20, 18);
		debris.gravity =
			new Vector3(0, -9.81, 0);
		debris.minEmitPower = 10;
		debris.maxEmitPower = 26;

		debris.targetStopDuration = 3.4;

		debris.start();
		this.particleSystems.push(debris);
	}

	/**
	 * Creates rising smoke particles that persist after the explosion.
	 * @param scene - The active Babylon.js scene.
	 * @param center - Explosion origin point.
	 */
	private createSmokePlume(scene: Scene, center: Vector3): void
	{
		const smoke: ParticleSystem =
			new ParticleSystem(
				"explosionSmoke",
				EXPLOSION_SMOKE_PARTICLE_COUNT,
				scene);

		smoke.emitter =
			center.clone();
		smoke.particleTexture =
			new Texture(
				"assets/babylonjs/textures/flare.png",
				scene);

		smoke.color1 =
			new Color4(0.3, 0.3, 0.3, 0.6);
		smoke.color2 =
			new Color4(0.15, 0.15, 0.15, 0.4);
		smoke.colorDead =
			new Color4(0.05, 0.05, 0.05, 0.0);

		smoke.minSize = 2.0;
		smoke.maxSize = 8.0;
		smoke.minLifeTime = 3.0;
		smoke.maxLifeTime = 6.0;

		smoke.emitRate =
			EXPLOSION_SMOKE_PARTICLE_COUNT;
		smoke.direction1 =
			new Vector3(-6, 8, -6);
		smoke.direction2 =
			new Vector3(6, 14, 6);
		smoke.minEmitPower = 2;
		smoke.maxEmitPower = 5;

		smoke.targetStopDuration = 5.5;

		smoke.start();
		this.particleSystems.push(smoke);
	}
}