/**
 * Particle Effects Service unit tests.
 * Tests creation and disposal lifecycle.
 * Visual correctness verified via Chrome DevTools screenshots at runtime.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { ParticleEffectsService } from "./particle-effects.service";

describe("ParticleEffectsService",
	() =>
	{
		let service: ParticleEffectsService;
		let scene: Scene;
		let engine: NullEngine;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							ParticleEffectsService
						]
					});

				service =
					TestBed.inject(ParticleEffectsService);

				engine =
					new NullEngine();
				scene =
					new Scene(engine);
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should dispose all active particle systems",
			() =>
			{
				service.initialize(scene);
				service.createExplosion(
					{ x: 0, y: 0, z: 10 },
					"standard");

				service.dispose();

				expect(service.getActiveCount())
					.toBe(0);
			});
	});