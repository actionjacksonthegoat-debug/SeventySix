/**
 * Road Collision Service unit tests.
 * Tests road boundary detection, bumper collision, and bumper mesh creation.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";
import { RoadBoundaryResult, RoadSegment } from "@sandbox/car-a-lot/models/car-a-lot.models";
import { RoadCollisionService } from "@sandbox/car-a-lot/services/road-collision.service";

describe("RoadCollisionService",
	() =>
	{
		let service: RoadCollisionService;
		let scene: Scene;
		let engine: NullEngine;

		/** Straight road segment at origin along Z-axis. */
		const straightSegment: RoadSegment =
			{
				positionX: 0,
				positionZ: 20,
				length: 40,
				rotationY: 0,
				isFork: false
			};

		/** Angled road segment for turn testing. */
		const angledSegment: RoadSegment =
			{
				positionX: 10,
				positionZ: 50,
				length: 30,
				rotationY: Math.PI / 4,
				isFork: false
			};

		/** Fork road segment. */
		const forkSegment: RoadSegment =
			{
				positionX: 0,
				positionZ: 60,
				length: 30,
				rotationY: -Math.PI / 4,
				isFork: true
			};

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							RoadCollisionService
						]
					});

				service =
					TestBed.inject(RoadCollisionService);

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

		describe("Road Detection",
			() =>
			{
				it("should detect kart is on road when within boundaries",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								0,
								20,
								[straightSegment]);

						expect(result.isOnRoad)
							.toBe(true);
						expect(result.isInBumperZone)
							.toBe(false);
					});

				it("should detect kart is off road when outside boundaries",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								50,
								20,
								[straightSegment]);

						expect(result.isOnRoad)
							.toBe(false);
					});

				it("should handle straight road segments",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								5,
								10,
								[straightSegment]);

						expect(result.isOnRoad)
							.toBe(true);
					});

				it("should handle angled road segments",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								10,
								50,
								[angledSegment]);

						expect(result.isOnRoad)
							.toBe(true);
					});

				it("should handle fork segments as valid road",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								0,
								60,
								[forkSegment]);

						expect(result.isOnRoad)
							.toBe(true);
					});

				it("should return nearest edge distance",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								8,
								20,
								[straightSegment]);

						expect(result.distanceToEdge)
							.toBeLessThan(10);
						expect(result.distanceToEdge)
							.toBeGreaterThan(0);
					});
			});

		describe("Bumper Collision",
			() =>
			{
				it("should detect collision with left bumper zone",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								-14,
								20,
								[straightSegment]);

						expect(result.isInBumperZone)
							.toBe(true);
					});

				it("should detect collision with right bumper zone",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								14,
								20,
								[straightSegment]);

						expect(result.isInBumperZone)
							.toBe(true);
					});

				it("should calculate bounce normal pointing away from bumper",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								11,
								20,
								[straightSegment]);

						expect(result.bumperNormalAngle)
							.toBeDefined();
					});

				it("should NOT be in bumper zone when near center",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								2,
								20,
								[straightSegment]);

						expect(result.isInBumperZone)
							.toBe(false);
					});

				it("should find correct segment index",
					() =>
					{
						const result: RoadBoundaryResult =
							service.checkRoadBoundary(
								10,
								50,
								[
									straightSegment,
									angledSegment
								]);

						expect(result.segmentIndex)
							.toBe(1);
					});
			});

		describe("Bumper Mesh Creation",
			() =>
			{
				it("should create bumper meshes for road segments",
					() =>
					{
						service.createBumpers(
							scene,
							[straightSegment]);

						const meshNames: string[] =
							scene
								.meshes
								.map(
									(mesh) => mesh.name)
								.filter(
									(name) => name.startsWith("bumper"));

						expect(meshNames.length)
							.toBeGreaterThan(0);
					});

				it("should create bumpers with red or white material",
					() =>
					{
						service.createBumpers(
							scene,
							[straightSegment]);

						const bumperMeshes: AbstractMesh[] =
							scene.meshes.filter(
								(mesh: AbstractMesh) =>
									mesh.name.startsWith("bumper"));

						expect(bumperMeshes.length)
							.toBeGreaterThan(0);

						for (const mesh of bumperMeshes)
						{
							expect(mesh.material)
								.toBeTruthy();
						}
					});

				it("should dispose bumper meshes on cleanup",
					() =>
					{
						service.createBumpers(
							scene,
							[straightSegment]);

						const meshCountBefore: number =
							scene.meshes.length;

						service.dispose();

						expect(scene.meshes.length)
							.toBeLessThan(meshCountBefore);
					});
			});
	});