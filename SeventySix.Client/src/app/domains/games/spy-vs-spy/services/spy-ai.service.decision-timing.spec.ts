/**
 * Spy AI Service decision-timing tests.
 * Verifies decision interval constants and frequent re-evaluation behavior.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import {
	AI_DECISION_INTERVAL_SECONDS,
	ROOM_FURNITURE,
	WHITE_SPY_SPAWN_X,
	WHITE_SPY_SPAWN_Z
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { ItemType, RemedyType, RoomId, SpyIdentity, StunState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyAiService } from "./spy-ai.service";
import { SpyPathfindingService } from "./spy-pathfinding.service";
import { SpyPhysicsService } from "./spy-physics.service";

describe("SpyAiService decision timing",
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

		it("AI_DECISION_INTERVAL_SECONDS should be 0.8",
			() =>
			{
				expect(AI_DECISION_INTERVAL_SECONDS)
					.toBe(0.8);
			});

		it("should re-evaluate with the lower decision interval",
			() =>
			{
				service.initialize(scene, aiNode);

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				const randomSpy: ReturnType<typeof vi.spyOn> =
					vi
						.spyOn(Math, "random")
						.mockReturnValue(0.99);

				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					allFurnitureIds(),
					[]);

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();
				const distanceFromSpawn: number =
					Math.sqrt(
						(state.positionX - WHITE_SPY_SPAWN_X) ** 2
							+ (state.positionZ - WHITE_SPY_SPAWN_Z) ** 2);

				expect(distanceFromSpawn, "AI should have moved after one decision interval")
					.toBeGreaterThan(0);

				randomSpy.mockRestore();
			});
	});