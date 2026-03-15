/**
 * Babylon Engine Service unit tests.
 * Tests Babylon.js engine lifecycle management within Angular.
 * Uses NullEngine to avoid WebGL dependency in test environment.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { BabylonEngineService } from "./babylon-engine.service";

/** Null engine options for test environment without GPU. */
const NULL_ENGINE_OPTIONS: { useNullEngine: boolean; } =
	{ useNullEngine: true };

describe("BabylonEngineService",
	() =>
	{
		let service: BabylonEngineService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							BabylonEngineService
						]
					});

				service =
					TestBed.inject(BabylonEngineService);
			});

		afterEach(
			() =>
			{
				service.dispose();
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should initialize engine with canvas element",
			() =>
			{
				// Arrange
				const canvas: HTMLCanvasElement =
					document.createElement("canvas");

				// Act
				const engine: Engine =
					service.createEngine(
						canvas,
						NULL_ENGINE_OPTIONS);

				// Assert
				expect(engine)
					.toBeTruthy();
			});

		it("should create scene from engine",
			() =>
			{
				// Arrange
				const canvas: HTMLCanvasElement =
					document.createElement("canvas");
				service.createEngine(
					canvas,
					NULL_ENGINE_OPTIONS);

				// Act
				const scene: Scene =
					service.createScene();

				// Assert
				expect(scene)
					.toBeTruthy();
			});

		it("should dispose engine on destroy",
			() =>
			{
				// Arrange
				const canvas: HTMLCanvasElement =
					document.createElement("canvas");
				service.createEngine(
					canvas,
					NULL_ENGINE_OPTIONS);
				service.createScene();

				// Act
				service.dispose();

				// Assert
				expect(service.getEngine())
					.toBeNull();
			});

		it("should handle resize events",
			() =>
			{
				// Arrange
				const canvas: HTMLCanvasElement =
					document.createElement("canvas");
				service.createEngine(
					canvas,
					NULL_ENGINE_OPTIONS);

				// Act & Assert
				expect(
					() => service.resize())
					.not
					.toThrow();
			});

		it("should throw when creating scene without engine",
			() =>
			{
				// Act & Assert
				expect(
					() => service.createScene())
					.toThrow();
			});
	});