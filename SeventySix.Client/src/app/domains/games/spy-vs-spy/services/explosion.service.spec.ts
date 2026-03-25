// <copyright file="explosion.service.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { ExplosionService } from "@games/spy-vs-spy/services/explosion.service";
import { SpyAudioService } from "@games/spy-vs-spy/services/spy-audio.service";

describe("ExplosionService",
	() =>
	{
		let service: ExplosionService;
		let audioService: SpyAudioService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							ExplosionService,
							SpyAudioService
						]
					});

				service =
					TestBed.inject(ExplosionService);
				audioService =
					TestBed.inject(SpyAudioService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);

				/* Camera required for scene.render(). */
				new FreeCamera("testCamera", Vector3.Zero(), scene);
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should store scene reference on initialize",
			() =>
			{
				service.initialize(scene);

				/* Service should not throw when calling methods after initialize. */
				expect(
					() => service.dispose())
					.not
					.toThrow();
			});

		describe("explodeIsland",
			() =>
			{
				beforeEach(
					() =>
					{
						service.initialize(scene);
					});

				it("should create particle systems at island center",
					() =>
					{
						service.explodeIsland(
							Vector3.Zero(),
							() =>
							{/* noop */});

						/* Particle systems are added to the scene's particleSystems array. */
						expect(scene.particleSystems.length)
							.toBeGreaterThan(0);
					});

				it("should call onComplete after explosion duration",
					() =>
					{
						vi.useFakeTimers();
						let completed: boolean = false;

						service.explodeIsland(
							Vector3.Zero(),
							() =>
							{
								completed = true;
							});

						/* Advance past explosion duration (4 seconds). */
						vi.advanceTimersByTime(4500);

						expect(completed)
							.toBe(true);

						vi.useRealTimers();
					});

				it("should call audio service for explosion sound",
					() =>
					{
						const playSpy: ReturnType<typeof vi.spyOn> =
							vi.spyOn(audioService, "playExplosionBoom");

						service.explodeIsland(
							Vector3.Zero(),
							() =>
							{/* noop */});

						expect(playSpy)
							.toHaveBeenCalledOnce();
					});

				it("should not throw when called without initialize",
					() =>
					{
						const uninitService: ExplosionService =
							TestBed.inject(ExplosionService);

						expect(
							() =>
								uninitService.explodeIsland(
									Vector3.Zero(),
									() =>
									{/* noop */}))
							.not
							.toThrow();
					});
			});

		describe("dispose",
			() =>
			{
				it("should clean up particle systems",
					() =>
					{
						service.initialize(scene);

						service.explodeIsland(
							Vector3.Zero(),
							() =>
							{/* noop */});

						service.dispose();

						expect(scene.particleSystems.length)
							.toBe(0);
					});

				it("should not throw when called multiple times",
					() =>
					{
						service.initialize(scene);
						service.dispose();

						expect(
							() => service.dispose())
							.not
							.toThrow();
					});
			});
	});