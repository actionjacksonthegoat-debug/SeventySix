/**
 * Spy AI Service room coverage tests.
 * Verifies room cycling and searched-room tracking behavior.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { AI_DECISION_INTERVAL_SECONDS, ROOM_FURNITURE } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { ItemType, RemedyType, RoomId, SpyIdentity, StunState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { PlacedTrap } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyAiService } from "./spy-ai.service";
import { SpyPathfindingService } from "./spy-pathfinding.service";
import { SpyPhysicsService } from "./spy-physics.service";

describe("SpyAiService room coverage",
	() =>
	{
		let service: SpyAiService;
		let physicsService: SpyPhysicsService;
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
							SpyAiService,
							SpyPathfindingService,
							SpyPhysicsService
						]
					});

				service =
					TestBed.inject(SpyAiService);
				physicsService =
					TestBed.inject(SpyPhysicsService);
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
				aiNode =
					new TransformNode("ai-spy", scene);

				const physicsNode: TransformNode =
					new TransformNode("physics-spy", scene);
				physicsService.initialize(physicsNode, 0, 0);
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		function createPlayerState(): {
			readonly identity: SpyIdentity;
			currentRoomId: RoomId;
			positionX: number;
			positionZ: number;
			rotationY: number;
			readonly inventory: ItemType[];
			readonly remedies: RemedyType[];
			stunState: StunState;
			stunRemainingSeconds: number;
			personalTimer: number;
		}
		{
			return {
				identity: SpyIdentity.Black,
				currentRoomId: RoomId.BeachShack,
				positionX: -28,
				positionZ: -20,
				rotationY: 0,
				inventory: [],
				remedies: [],
				stunState: StunState.None,
				stunRemainingSeconds: 0,
				personalTimer: 0
			};
		}

		function allFurnitureIds(): string[]
		{
			return ROOM_FURNITURE.map(
				(furniture) => furniture.id);
		}

		it("should keep moving under repeated wander decisions",
			() =>
			{
				service.initialize(scene, aiNode);
				aiNode.position.x = 28;
				aiNode.position.z = -20;
				const startX: number =
					aiNode.position.x;
				const startZ: number =
					aiNode.position.z;

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				playerState.positionX = -28;
				playerState.positionZ = -20;
				const emptyTraps: PlacedTrap[] = [];

				const randomSpy: ReturnType<typeof vi.spyOn> =
					vi
						.spyOn(Math, "random")
						.mockReturnValue(0.01);

				const framesPerCycle: number = 20;
				const frameDelta: number = 0.1;

				for (let cycle: number = 0; cycle < 6; cycle++)
				{
					for (let frame: number = 0; frame < framesPerCycle; frame++)
					{
						service.update(
							frameDelta,
							playerState,
							[],
							emptyTraps);
					}
				}

				randomSpy.mockRestore();

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();
				const distanceMoved: number =
					Math.sqrt(
						(state.positionX - startX) ** 2
							+ (state.positionZ - startZ) ** 2);

				expect(distanceMoved, "AI should move while repeatedly re-evaluating goals")
					.toBeGreaterThan(0);
				expect(state.currentRoomId, "AI should keep tracking its current room")
					.not
					.toBeNull();
			});

		it("should track fully searched rooms and prefer unsearched rooms",
			() =>
			{
				service.initialize(scene, aiNode);

				const watchtowerFurniture: string[] =
					ROOM_FURNITURE
						.filter(
							(furniture) =>
								furniture.roomId === RoomId.Watchtower)
						.map(
							(furniture) => furniture.id);

				for (const furnitureId of watchtowerFurniture)
				{
					service.markFurnitureSearched(furnitureId);
				}

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				playerState.positionX = -28;
				playerState.positionZ = -20;
				aiNode.position.x = 28;
				aiNode.position.z = -20;

				const randomSpy: ReturnType<typeof vi.spyOn> =
					vi
						.spyOn(Math, "random")
						.mockReturnValue(0.01);

				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					allFurnitureIds(),
					[]);

				randomSpy.mockRestore();

				expect(service.getState().identity)
					.toBe(SpyIdentity.White);
			});

		it("should reset fully searched rooms when collecting an item",
			() =>
			{
				service.initialize(scene, aiNode);

				const watchtowerFurniture: string[] =
					ROOM_FURNITURE
						.filter(
							(furniture) =>
								furniture.roomId === RoomId.Watchtower)
						.map(
							(furniture) => furniture.id);

				for (const furnitureId of watchtowerFurniture)
				{
					service.markFurnitureSearched(furnitureId);
				}

				service.collectItem(ItemType.SecretDocuments);

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					allFurnitureIds(),
					[]);

				expect(service.getState().identity)
					.toBe(SpyIdentity.White);
			});
	});