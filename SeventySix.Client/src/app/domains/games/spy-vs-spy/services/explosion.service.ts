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

		this.audioService.playExplosionBoom();

		this.createFireBurst(center);
		this.createDebris(center);
		this.createSmokePlume(center);

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

		for (const ps of this.particleSystems)
		{
			ps.dispose();
		}
		this.particleSystems = [];

		this.sceneRef = null;
	}

	/**
	 * Creates the initial fire burst particle system.
	 * @param center - Explosion origin point.
	 */
	private createFireBurst(center: Vector3): void
	{
		const fire: ParticleSystem =
			new ParticleSystem(
				"explosionFire",
				EXPLOSION_FIRE_PARTICLE_COUNT,
				this.sceneRef!);

		fire.emitter =
			center.clone();
		fire.particleTexture =
			new Texture(
				"assets/babylonjs/textures/flare.png",
				this.sceneRef!);

		fire.color1 =
			new Color4(1.0, 0.6, 0.0, 1.0);
		fire.color2 =
			new Color4(1.0, 0.2, 0.0, 1.0);
		fire.colorDead =
			new Color4(0.2, 0.0, 0.0, 0.0);

		fire.minSize = 0.5;
		fire.maxSize = 2.5;
		fire.minLifeTime = 0.3;
		fire.maxLifeTime = 1.0;

		fire.emitRate =
			EXPLOSION_FIRE_PARTICLE_COUNT;
		fire.direction1 =
			new Vector3(-3, 8, -3);
		fire.direction2 =
			new Vector3(3, 12, 3);
		fire.minEmitPower = 2;
		fire.maxEmitPower = 6;

		fire.targetStopDuration = 1.0;

		fire.start();
		this.particleSystems.push(fire);
	}

	/**
	 * Creates debris particles thrown outward from the explosion.
	 * @param center - Explosion origin point.
	 */
	private createDebris(center: Vector3): void
	{
		const debris: ParticleSystem =
			new ParticleSystem(
				"explosionDebris",
				EXPLOSION_DEBRIS_PARTICLE_COUNT,
				this.sceneRef!);

		debris.emitter =
			center.clone();
		debris.particleTexture =
			new Texture(
				"assets/babylonjs/textures/flare.png",
				this.sceneRef!);

		debris.color1 =
			new Color4(0.5, 0.35, 0.2, 1.0);
		debris.color2 =
			new Color4(0.4, 0.4, 0.4, 1.0);
		debris.colorDead =
			new Color4(0.2, 0.2, 0.2, 0.0);

		debris.minSize = 0.2;
		debris.maxSize = 1.0;
		debris.minLifeTime = 0.5;
		debris.maxLifeTime = 2.0;

		debris.emitRate =
			EXPLOSION_DEBRIS_PARTICLE_COUNT;
		debris.direction1 =
			new Vector3(-8, 4, -8);
		debris.direction2 =
			new Vector3(8, 10, 8);
		debris.gravity =
			new Vector3(0, -9.81, 0);
		debris.minEmitPower = 3;
		debris.maxEmitPower = 8;

		debris.targetStopDuration = 2.0;

		debris.start();
		this.particleSystems.push(debris);
	}

	/**
	 * Creates rising smoke particles that persist after the explosion.
	 * @param center - Explosion origin point.
	 */
	private createSmokePlume(center: Vector3): void
	{
		const smoke: ParticleSystem =
			new ParticleSystem(
				"explosionSmoke",
				EXPLOSION_SMOKE_PARTICLE_COUNT,
				this.sceneRef!);

		smoke.emitter =
			center.clone();
		smoke.particleTexture =
			new Texture(
				"assets/babylonjs/textures/flare.png",
				this.sceneRef!);

		smoke.color1 =
			new Color4(0.3, 0.3, 0.3, 0.6);
		smoke.color2 =
			new Color4(0.15, 0.15, 0.15, 0.4);
		smoke.colorDead =
			new Color4(0.05, 0.05, 0.05, 0.0);

		smoke.minSize = 1.0;
		smoke.maxSize = 4.0;
		smoke.minLifeTime = 1.5;
		smoke.maxLifeTime = 3.5;

		smoke.emitRate =
			EXPLOSION_SMOKE_PARTICLE_COUNT / 2;
		smoke.direction1 =
			new Vector3(-2, 3, -2);
		smoke.direction2 =
			new Vector3(2, 8, 2);
		smoke.minEmitPower = 0.5;
		smoke.maxEmitPower = 2;

		smoke.targetStopDuration = 3.5;

		smoke.start();
		this.particleSystems.push(smoke);
	}
}