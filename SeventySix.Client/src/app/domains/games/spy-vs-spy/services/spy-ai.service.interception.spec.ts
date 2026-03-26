/**
 * Spy AI Service interception tests.
 * Verifies behavior when the AI considers intercepting the player.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { AI_DECISION_INTERVAL_SECONDS, ROOM_FURNITURE } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { ItemType, RemedyType, RoomId, SpyIdentity, StunState } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyAiService } from "./spy-ai.service";
import { SpyPathfindingService } from "./spy-pathfinding.service";
import { SpyPhysicsService } from "./spy-physics.service";

describe("SpyAiService interception",
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

		it("should increase aggression when player is in same room",
			() =>
			{
				service.initialize(scene, aiNode);
				aiNode.position.x = 28;
				aiNode.position.z = -20;

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				playerState.currentRoomId =
					RoomId.Watchtower;
				playerState.positionX = 28;
				playerState.positionZ = -18;

				const randomSpy: ReturnType<typeof vi.spyOn> =
					vi
						.spyOn(Math, "random")
						.mockReturnValue(0.10);

				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					allFurnitureIds(),
					[]);

				randomSpy.mockRestore();

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();
				expect(state.identity)
					.toBe(SpyIdentity.White);
			});

		it("should consider intercepting player in adjacent room",
			() =>
			{
				service.initialize(scene, aiNode);
				aiNode.position.x = 28;
				aiNode.position.z = -20;

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				playerState.currentRoomId =
					RoomId.JungleHQ;
				playerState.positionX = 0;
				playerState.positionZ = -20;

				const randomSpy: ReturnType<typeof vi.spyOn> =
					vi
						.spyOn(Math, "random")
						.mockReturnValue(0.10);

				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					allFurnitureIds(),
					[]);

				randomSpy.mockRestore();

				expect(service.getState().identity)
					.toBe(SpyIdentity.White);
			});
	});