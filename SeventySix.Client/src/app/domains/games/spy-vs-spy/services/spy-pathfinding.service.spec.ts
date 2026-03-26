/**
 * Spy Pathfinding Service unit tests.
 * Tests navigation, room detection, doorway BFS, movement, and boundary clamping.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { RoomId } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyPathfindingService } from "./spy-pathfinding.service";
import { SpyPhysicsService } from "./spy-physics.service";

describe("SpyPathfindingService",
	() =>
	{
		let service: SpyPathfindingService;
		let engine: NullEngine;
		let scene: Scene;
		let aiNode: TransformNode;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							SpyPathfindingService,
							SpyPhysicsService
						]
					});

				service =
					TestBed.inject(SpyPathfindingService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
				aiNode =
					new TransformNode("ai-spy", scene);

				/* Initialize physics so wall collision AABBs are built. */
				const physicsService: SpyPhysicsService =
					TestBed.inject(SpyPhysicsService);
				const physicsNode: TransformNode =
					new TransformNode("physics-spy", scene);
				physicsService.initialize(physicsNode, 0, 0);
			});

		afterEach(
			() =>
			{
				scene.dispose();
				engine.dispose();
			});

		describe("creation",
			() =>
			{
				it("should create without throwing",
					() =>
					{
						expect(service)
							.toBeTruthy();
					});
			});

		describe("setGoal / getGoal",
			() =>
			{
				it("should set and retrieve goal coordinates",
					() =>
					{
						service.setGoal(10, 15);

						const goal: { readonly x: number; readonly z: number; } =
							service.getGoal();

						expect(goal.x)
							.toBe(10);
						expect(goal.z)
							.toBe(15);
					});

				it("should update goal when called again",
					() =>
					{
						service.setGoal(5, 5);
						service.setGoal(-10, 20);

						const goal: { readonly x: number; readonly z: number; } =
							service.getGoal();

						expect(goal.x)
							.toBe(-10);
						expect(goal.z)
							.toBe(20);
					});
			});

		describe("clearWaypoint",
			() =>
			{
				it("should not throw when called without active waypoint",
					() =>
					{
						expect(
							() =>
							{
								service.clearWaypoint();
							})
							.not
							.toThrow();
					});
			});

		describe("determineCurrentRoom",
			() =>
			{
				it("should return BeachShack for position at BeachShack center",
					() =>
					{
						const roomId: RoomId =
							service.determineCurrentRoom(-28, -20);

						expect(roomId)
							.toBe(RoomId.BeachShack);
					});

				it("should return JungleHQ for position at JungleHQ center",
					() =>
					{
						const roomId: RoomId =
							service.determineCurrentRoom(0, -20);

						expect(roomId)
							.toBe(RoomId.JungleHQ);
					});

				it("should return Library for position at Library center",
					() =>
					{
						const roomId: RoomId =
							service.determineCurrentRoom(28, 20);

						expect(roomId)
							.toBe(RoomId.Library);
					});

				it("should return nearest room for a position outside all rooms",
					() =>
					{
						const roomId: RoomId =
							service.determineCurrentRoom(50, 50);

						expect(Object.values(RoomId))
							.toContain(roomId);
					});
			});

		describe("determineRoomForPosition",
			() =>
			{
				it("should match determineCurrentRoom for same position",
					() =>
					{
						const positionX: number = -28;
						const positionZ: number = -20;

						const roomFromCurrent: RoomId =
							service.determineCurrentRoom(positionX, positionZ);
						const roomFromPosition: RoomId =
							service.determineRoomForPosition(positionX, positionZ);

						expect(roomFromPosition)
							.toBe(roomFromCurrent);
					});
			});

		describe("findNearestRoomToPosition",
			() =>
			{
				it("should return Library for exact center position",
					() =>
					{
						const roomId: RoomId =
							service.findNearestRoomToPosition(28, 20);

						expect(roomId)
							.toBe(RoomId.Library);
					});

				it("should return nearest room for far-away position",
					() =>
					{
						const roomId: RoomId =
							service.findNearestRoomToPosition(100, 100);

						expect(Object.values(RoomId))
							.toContain(roomId);
					});
			});

		describe("findDoorwayBetweenRooms",
			() =>
			{
				it("should return a doorway for directly connected rooms",
					() =>
					{
						const doorway: { readonly x: number; readonly z: number; } | null =
							service.findDoorwayBetweenRooms(
								RoomId.BeachShack,
								RoomId.JungleHQ);

						expect(doorway).not.toBeNull();
						expect(doorway!.x)
							.toBeDefined();
						expect(doorway!.z)
							.toBeDefined();
					});

				it("should return a doorway for multi-hop rooms via BFS",
					() =>
					{
						const doorway: { readonly x: number; readonly z: number; } | null =
							service.findDoorwayBetweenRooms(
								RoomId.BeachShack,
								RoomId.Library);

						expect(doorway).not.toBeNull();
					});

				it("should return null for an invalid fromRoomId",
					() =>
					{
						const doorway: { readonly x: number; readonly z: number; } | null =
							service.findDoorwayBetweenRooms(
								"InvalidRoom" as RoomId,
								RoomId.Library);

						expect(doorway)
							.toBeNull();
					});
			});

		describe("moveTowardGoal",
			() =>
			{
				it("should move the AI node closer to the goal",
					() =>
					{
						aiNode.position.x = -28;
						aiNode.position.z = -20;
						service.setGoal(-24, -20);

						const initialDistX: number =
							Math.abs(aiNode.position.x - (-24));

						service.moveTowardGoal(aiNode, 0.016);

						const finalDistX: number =
							Math.abs(aiNode.position.x - (-24));

						expect(finalDistX)
							.toBeLessThan(initialDistX);
					});

				it("should clamp position within HALF_ISLAND boundaries",
					() =>
					{
						const halfIsland: number = 40;
						aiNode.position.x = 39;
						aiNode.position.z = 39;
						service.setGoal(50, 50);

						service.moveTowardGoal(aiNode, 1.0);

						expect(aiNode.position.x)
							.toBeLessThanOrEqual(halfIsland);
						expect(aiNode.position.z)
							.toBeLessThanOrEqual(halfIsland);
					});

				it("should rotate the AI node toward goal direction",
					() =>
					{
						aiNode.position.x = -28;
						aiNode.position.z = -20;
						const initialRotY: number =
							aiNode.rotation.y;

						service.setGoal(-20, -20);
						service.moveTowardGoal(aiNode, 0.016);

						expect(aiNode.rotation.y).not.toBe(initialRotY);
					});
			});

		describe("reset",
			() =>
			{
				it("should set goal to spawn position and clear waypoints",
					() =>
					{
						service.setGoal(10, 10);

						service.reset(28, -20);

						const goal: { readonly x: number; readonly z: number; } =
							service.getGoal();

						expect(goal.x)
							.toBe(28);
						expect(goal.z)
							.toBe(-20);
					});
			});
	});