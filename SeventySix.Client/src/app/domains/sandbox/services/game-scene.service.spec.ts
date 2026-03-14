/**
 * Game Scene Service unit tests.
 * Tests space environment, starfield, lighting, and camera setup.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { GameSceneService } from "./game-scene.service";

describe("GameSceneService",
	() =>
	{
		let service: GameSceneService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							GameSceneService
						]
					});

				service =
					TestBed.inject(GameSceneService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
			});

		afterEach(
			() =>
			{
				scene.dispose();
				engine.dispose();
			});

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should set up directional and ambient lighting",
			() =>
			{
				// Arrange & Act
				service.setupEnvironment(scene);

				// Assert — at least two lights (ambient + directional)
				expect(scene.lights.length)
					.toBeGreaterThanOrEqual(2);
			});

		it("should configure third-person camera",
			() =>
			{
				// Arrange & Act
				service.setupEnvironment(scene);

				// Assert — camera should exist
				expect(scene.activeCamera)
					.toBeTruthy();
			});

		it("should set scene clear color to dark space",
			() =>
			{
				// Arrange & Act
				service.setupEnvironment(scene);

				// Assert — clear color should be very dark
				expect(scene.clearColor.r)
					.toBeLessThan(0.1);
				expect(scene.clearColor.g)
					.toBeLessThan(0.1);
				expect(scene.clearColor.b)
					.toBeLessThan(0.2);
			});
	});