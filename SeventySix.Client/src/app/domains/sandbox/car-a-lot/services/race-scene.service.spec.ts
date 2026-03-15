/**
 * Race Scene Service unit tests.
 * Tests scene setup: clear color, lighting, and ground plane.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { RaceSceneService } from "@sandbox/car-a-lot/services/race-scene.service";

describe("RaceSceneService",
	() =>
	{
		let service: RaceSceneService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							RaceSceneService
						]
					});

				service =
					TestBed.inject(RaceSceneService);
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

		it("should set scene clear color to sky blue",
			() =>
			{
				service.initialize(scene);

				expect(scene.clearColor.r)
					.toBeGreaterThan(0.4);
				expect(scene.clearColor.b)
					.toBeGreaterThan(0.7);
			});

		it("should create a hemispheric light with warm diffuse",
			() =>
			{
				service.initialize(scene);

				const lights: number =
					scene.lights.length;

				expect(lights)
					.toBeGreaterThanOrEqual(1);
			});

		it("should create a directional light for sunlight",
			() =>
			{
				service.initialize(scene);

				expect(scene.lights.length)
					.toBeGreaterThanOrEqual(2);
			});

		it("should create a ground plane with light green material",
			() =>
			{
				service.initialize(scene);

				const groundMeshes: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name === "ground")
						.length;

				expect(groundMeshes)
					.toBe(1);
			});

		it("should dispose all lights and ground on cleanup",
			() =>
			{
				service.initialize(scene);
				service.dispose();

				const groundMeshes: number =
					scene
						.meshes
						.filter(
							(mesh) => mesh.name === "ground")
						.length;

				expect(groundMeshes)
					.toBe(0);
			});
	});