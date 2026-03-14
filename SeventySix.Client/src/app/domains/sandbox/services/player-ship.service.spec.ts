/**
 * Player Ship Service unit tests.
 * Tests X-Wing mesh creation, movement, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { PlayerShipService } from "./player-ship.service";

describe("PlayerShipService",
	() =>
	{
		let service: PlayerShipService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							PlayerShipService
						]
					});

				service =
					TestBed.inject(PlayerShipService);
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

		it("should create ship mesh and return it",
			() =>
			{
				// Arrange & Act
				const ship: unknown =
					service.createShip(scene);

				// Assert
				expect(ship)
					.toBeTruthy();
			});

		it("should return current ship via getShipMesh",
			() =>
			{
				// Arrange
				service.createShip(scene);

				// Act
				const result: unknown =
					service.getShipMesh();

				// Assert
				expect(result)
					.toBeTruthy();
			});

		it("should dispose ship resources cleanly",
			() =>
			{
				// Arrange
				service.createShip(scene);

				// Act
				service.dispose();

				// Assert
				expect(service.getShipMesh())
					.toBeNull();
			});
	});