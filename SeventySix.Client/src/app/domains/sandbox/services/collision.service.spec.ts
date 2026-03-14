/**
 * Collision Service unit tests.
 * Tests bounding sphere collision detection.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import type { CollidableEntity } from "@sandbox/models/game.models";
import { CollisionService } from "./collision.service";

describe("CollisionService",
	() =>
	{
		let service: CollisionService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							CollisionService
						]
					});

				service =
					TestBed.inject(CollisionService);
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

		it("should detect collision between overlapping bounding spheres",
			() =>
			{
				// Arrange
				const meshA: Mesh =
					MeshBuilder.CreateSphere(
						"meshA",
						{ diameter: 1 },
						scene);
				meshA.position =
					new Vector3(
						0,
						0,
						0);

				const meshB: Mesh =
					MeshBuilder.CreateSphere(
						"meshB",
						{ diameter: 1 },
						scene);
				meshB.position =
					new Vector3(
						0.5,
						0,
						0);

				const entityA: CollidableEntity =
					{
						mesh: meshA,
						radius: 1,
						group: "player"
					};
				const entityB: CollidableEntity =
					{
						mesh: meshB,
						radius: 1,
						group: "enemy"
					};

				service.register(entityA);
				service.register(entityB);

				// Act
				const results: unknown[] =
					service.checkCollisions(
						"player",
						"enemy");

				// Assert
				expect(results.length)
					.toBeGreaterThan(0);
			});

		it("should not detect collision for distant objects",
			() =>
			{
				// Arrange
				const meshA: Mesh =
					MeshBuilder.CreateSphere(
						"meshA",
						{ diameter: 1 },
						scene);
				meshA.position =
					new Vector3(
						0,
						0,
						0);

				const meshB: Mesh =
					MeshBuilder.CreateSphere(
						"meshB",
						{ diameter: 1 },
						scene);
				meshB.position =
					new Vector3(
						100,
						100,
						100);

				const entityA: CollidableEntity =
					{
						mesh: meshA,
						radius: 1,
						group: "player"
					};
				const entityB: CollidableEntity =
					{
						mesh: meshB,
						radius: 1,
						group: "enemy"
					};

				service.register(entityA);
				service.register(entityB);

				// Act
				const results: unknown[] =
					service.checkCollisions(
						"player",
						"enemy");

				// Assert
				expect(results.length)
					.toBe(0);
			});

		it("should handle unregistration",
			() =>
			{
				// Arrange
				const meshA: Mesh =
					MeshBuilder.CreateSphere(
						"meshA",
						{ diameter: 1 },
						scene);
				const entityA: CollidableEntity =
					{
						mesh: meshA,
						radius: 1,
						group: "player"
					};

				service.register(entityA);

				// Act
				service.unregister(entityA);
				const results: unknown[] =
					service.checkCollisions(
						"player",
						"enemy");

				// Assert
				expect(results.length)
					.toBe(0);
			});

		it("should return empty results for nonexistent groups",
			() =>
			{
				// Act
				const results: unknown[] =
					service.checkCollisions(
						"nonexistent",
						"alsoMissing");

				// Assert
				expect(results.length)
					.toBe(0);
			});

		it("should clear all entities on dispose",
			() =>
			{
				// Arrange
				const meshA: Mesh =
					MeshBuilder.CreateSphere(
						"meshA",
						{ diameter: 1 },
						scene);
				const entityA: CollidableEntity =
					{
						mesh: meshA,
						radius: 1,
						group: "player"
					};
				service.register(entityA);

				// Act
				service.dispose();
				const results: unknown[] =
					service.checkCollisions(
						"player",
						"enemy");

				// Assert
				expect(results.length)
					.toBe(0);
			});
	});