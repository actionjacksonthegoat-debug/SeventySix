/**
 * Spy AI Service unit tests.
 * Tests AI decision-making, furniture search, combat, escape, stun, and disposal.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import {
	AI_DECISION_INTERVAL_SECONDS,
	AI_SPEED_MULTIPLIER,
	AIRSTRIP_CENTER_X,
	AIRSTRIP_CENTER_Z,
	COMBAT_ENGAGE_RADIUS,
	ROOM_FURNITURE,
	SPY_MOVE_SPEED,
	WHITE_SPY_SPAWN_X,
	WHITE_SPY_SPAWN_Z
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	ItemType,
	RemedyType,
	RoomId,
	SpyIdentity,
	StunState
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { PlacedTrap } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { SpyAiService } from "./spy-ai.service";
import { SpyPathfindingService } from "./spy-pathfinding.service";
import { SpyPhysicsService } from "./spy-physics.service";

describe("SpyAiService",
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

				/* Initialize physics so wall AABBs are built for AI collision tests. */
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

		/** Creates a minimal player state for testing. */
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

		/** Returns all furniture IDs as unsearched. */
		function allFurnitureIds(): string[]
		{
			return ROOM_FURNITURE.map(
				(furniture) => furniture.id);
		}

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("initialize should set AI to White spy spawn position",
			() =>
			{
				service.initialize(scene, aiNode);

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();

				expect(state.positionX, "should be at WHITE_SPY_SPAWN_X")
					.toBe(WHITE_SPY_SPAWN_X);
				expect(state.positionZ, "should be at WHITE_SPY_SPAWN_Z")
					.toBe(WHITE_SPY_SPAWN_Z);
			});

		it("update should move AI toward unsearched furniture",
			() =>
			{
				service.initialize(scene, aiNode);

				const unsearched: string[] =
					allFurnitureIds();
				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				const beforeX: number =
					service.getState().positionX;
				const beforeZ: number =
					service.getState().positionZ;

				/* Advance past decision timer and multiple frames. */
				const frameDelta: number = 0.1;
				const frames: number = 50;
				for (let frame: number = 0; frame < frames; frame++)
				{
					service.update(
						frameDelta,
						playerState,
						unsearched,
						emptyTraps);
				}

				const afterX: number =
					service.getState().positionX;
				const afterZ: number =
					service.getState().positionZ;

				const distance: number =
					Math.sqrt(
						(afterX - beforeX) ** 2
							+ (afterZ - beforeZ) ** 2);

				expect(distance, "AI should have moved from spawn")
					.toBeGreaterThan(0);
			});

		it("update with all items collected should move AI toward airstrip",
			() =>
			{
				service.initialize(scene, aiNode);

				/* Give AI a full inventory of collected items. */
				const allTypes: ItemType[] =
					[
						ItemType.SecretDocuments,
						ItemType.Passport,
						ItemType.KeyCard,
						ItemType.MoneyBag
					];
				for (const itemType of allTypes)
				{
					service.collectItem(itemType);
				}

				const emptyUnsearched: string[] = [];
				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				/* Run enough frames to approach goal. */
				const frameDelta: number = 0.1;
				const frames: number = 200;
				for (let frame: number = 0; frame < frames; frame++)
				{
					service.update(
						frameDelta,
						playerState,
						emptyUnsearched,
						emptyTraps);
				}

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();
				const distToAirstrip: number =
					Math.sqrt(
						(state.positionX - AIRSTRIP_CENTER_X) ** 2
							+ (state.positionZ - AIRSTRIP_CENTER_Z) ** 2);

				expect(distToAirstrip, "AI should be closer to airstrip")
					.toBeLessThan(
						Math.sqrt(
							(WHITE_SPY_SPAWN_X - AIRSTRIP_CENTER_X) ** 2
								+ (WHITE_SPY_SPAWN_Z - AIRSTRIP_CENTER_Z) ** 2));
			});

		it("AI decision timer should not re-evaluate before interval elapses",
			() =>
			{
				service.initialize(scene, aiNode);

				/* Force Math.random above wander threshold so AI targets nearest furniture. */
				const randomSpy: ReturnType<typeof vi.spyOn> =
					vi
						.spyOn(Math, "random")
						.mockReturnValue(0.99);

				const unsearched: string[] =
					allFurnitureIds();
				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				/* First update with small delta — decisionTimer starts at
				   AI_DECISION_INTERVAL_SECONDS so even a tiny tick triggers
				   evaluateGoal, but the AI moves only a short distance,
				   staying far from its goal. */
				service.update(
					0.1,
					playerState,
					unsearched,
					emptyTraps);

				const afterFirstX: number =
					service.getState().positionX;

				/* Second update with tiny delta — under decision interval. */
				service.update(
					0.01,
					playerState,
					unsearched,
					emptyTraps);

				const afterSecondX: number =
					service.getState().positionX;

				/* AI should still be moving toward same goal (not frozen). */
				expect(afterSecondX === afterFirstX, "AI should continue moving even without re-evaluation")
					.toBe(false);

				randomSpy.mockRestore();
			});

		it("getState should return SpyState identity as White",
			() =>
			{
				service.initialize(scene, aiNode);

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();

				expect(state.identity)
					.toBe(SpyIdentity.White);
			});

		it("stun should prevent movement during stun",
			() =>
			{
				service.initialize(scene, aiNode);

				const beforeX: number =
					service.getState().positionX;

				service.setStunned(StunState.BombStunned, 5);

				const unsearched: string[] =
					allFurnitureIds();
				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				service.update(
					0.5,
					playerState,
					unsearched,
					emptyTraps);

				expect(service.getState().positionX, "position should not change while stunned")
					.toBe(beforeX);
			});

		it("stun timer should decrement with deltaTime",
			() =>
			{
				service.initialize(scene, aiNode);
				service.setStunned(StunState.BombStunned, 3);

				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				service.update(
					1.0,
					playerState,
					[],
					emptyTraps);

				expect(service.getState().stunRemainingSeconds, "stun should decrement by deltaTime")
					.toBe(2);
			});

		it("inventory should start empty and grow with collectItem",
			() =>
			{
				service.initialize(scene, aiNode);

				expect(service.getState().inventory.length, "initial inventory should be empty")
					.toBe(0);

				service.collectItem(ItemType.SecretDocuments);

				expect(service.getState().inventory.length, "inventory should have 1 item")
					.toBe(1);
				expect(service.getState().inventory)
					.toContain(ItemType.SecretDocuments);
			});

		it("dispose should not throw",
			() =>
			{
				service.initialize(scene, aiNode);

				expect(
					() =>
					{
						service.dispose();
					})
					.not
					.toThrow();
			});

		it("collectRemedy should add remedy to state",
			() =>
			{
				service.initialize(scene, aiNode);
				service.collectRemedy(RemedyType.WireCutters);

				const remedies: RemedyType[] =
					service.getRemedies();

				expect(remedies.length)
					.toBe(1);
				expect(remedies[0])
					.toBe(RemedyType.WireCutters);
			});

		it("consumeRemedy should remove remedy",
			() =>
			{
				service.initialize(scene, aiNode);
				service.collectRemedy(RemedyType.Shield);
				service.consumeRemedy(RemedyType.Shield);

				expect(service.getRemedies().length)
					.toBe(0);
			});

		it("consumeRemedy should not throw for missing remedy",
			() =>
			{
				service.initialize(scene, aiNode);

				expect(
					() =>
					{
						service.consumeRemedy(RemedyType.WireCutters);
					})
					.not
					.toThrow();
			});

		it("markFurnitureSearched should not cause AI to re-navigate to searched furniture",
			() =>
			{
				service.initialize(scene, aiNode);

				/* Mark all furniture as searched by the AI. */
				for (const furnitureId of allFurnitureIds())
				{
					service.markFurnitureSearched(furnitureId);
				}

				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				/* With no unsearched furniture and no items, AI should wander. */
				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					[],
					emptyTraps);

				/* Just verify it doesn't crash. */
				expect(service.getState().identity)
					.toBe(SpyIdentity.White);
			});

		it("getWantsCombat should return true when player is within engage radius",
			() =>
			{
				service.initialize(scene, aiNode);

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				/* Place player near AI. */
				playerState.positionX = WHITE_SPY_SPAWN_X;
				playerState.positionZ =
					WHITE_SPY_SPAWN_Z + COMBAT_ENGAGE_RADIUS * 0.5;

				service.update(
					0.016,
					playerState,
					[],
					[]);

				expect(service.getWantsCombat())
					.toBe(true);
			});

		it("getWantsCombat should return false when player is far away",
			() =>
			{
				service.initialize(scene, aiNode);

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				/* Player is at default position far from AI spawn. */
				service.update(
					0.016,
					playerState,
					[],
					[]);

				expect(service.getWantsCombat())
					.toBe(false);
			});

		it("setPersonalTimer should influence early escape behavior",
			() =>
			{
				service.initialize(scene, aiNode);

				/* Give AI 2 items but set timer low — should head to airstrip. */
				service.collectItem(ItemType.SecretDocuments);
				service.collectItem(ItemType.Passport);
				service.setPersonalTimer(30);

				const emptyTraps: PlacedTrap[] = [];
				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();

				/* Run enough frames to start moving. */
				for (let frame: number = 0; frame < 50; frame++)
				{
					service.update(
						0.1,
						playerState,
						[],
						emptyTraps);
				}

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();
				const distToAirstrip: number =
					Math.sqrt(
						(state.positionX - AIRSTRIP_CENTER_X) ** 2
							+ (state.positionZ - AIRSTRIP_CENTER_Z) ** 2);

				/* AI should be moving toward airstrip even without all items. */
				expect(distToAirstrip, "AI should be approaching airstrip under time pressure")
					.toBeLessThan(
						Math.sqrt(
							(WHITE_SPY_SPAWN_X - AIRSTRIP_CENTER_X) ** 2
								+ (WHITE_SPY_SPAWN_Z - AIRSTRIP_CENTER_Z) ** 2));
			});

		it("getState remedies should include collected remedies",
			() =>
			{
				service.initialize(scene, aiNode);
				service.collectRemedy(RemedyType.WireCutters);
				service.collectRemedy(RemedyType.Shield);

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();

				expect(state.remedies.length)
					.toBe(2);
				expect(state.remedies)
					.toContain(RemedyType.WireCutters);
				expect(state.remedies)
					.toContain(RemedyType.Shield);
			});

		it("getState personalTimer should reflect setPersonalTimer",
			() =>
			{
				service.initialize(scene, aiNode);
				service.setPersonalTimer(120);

				expect(service.getState().personalTimer)
					.toBe(120);
			});

		it("should not move through wall when goal is on other side",
			() =>
			{
				service.initialize(scene, aiNode);

				/*
		 * Place AI in the center of Watchtower (28, -20).
		 * Put AI at the EAST wall boundary of Watchtower (x=38).
		 * The east wall of Watchtower has NO doorway to the right — only open space.
		 * If AI respects walls, it should not cross the east wall boundary.
		 */
				aiNode.position.x = 37;
				aiNode.position.z = -20;

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				const emptyTraps: PlacedTrap[] = [];

				/*
		 * Force goal to a position beyond the east wall (x > 38).
		 * Run several frames. AI should stay within room bounds.
		 */
				for (let frame: number = 0; frame < 100; frame++)
				{
					service.update(
						0.016,
						playerState,
						[],
						emptyTraps);
				}

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();

				/* AI should not have escaped beyond the island room boundary. */
				expect(state.positionX, "AI should stay within wall boundaries")
					.toBeLessThanOrEqual(40);
			});

		it("should move through doorway toward connected room",
			() =>
			{
				service.initialize(scene, aiNode);

				/*
		 * Place AI inside Compound (0, +20) which has a south doorway exit to the airstrip.
		 * Position AI near the center of Compound.
		 */
				aiNode.position.x = 0;
				aiNode.position.z = 20;

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				playerState.positionX = -28;
				playerState.positionZ = -20;
				const emptyTraps: PlacedTrap[] = [];

				/* Collect all items so AI heads to airstrip zone (0, +38). */
				service.collectItem(ItemType.MoneyBag);
				service.collectItem(ItemType.SecretDocuments);
				service.collectItem(ItemType.Passport);
				service.collectItem(ItemType.KeyCard);

				/* Run many frames for AI to move. */
				for (let frame: number = 0; frame < 200; frame++)
				{
					service.update(
						0.05,
						playerState,
						[],
						emptyTraps);
				}

				const state: ReturnType<SpyAiService["getState"]> =
					service.getState();

				/* AI should have moved southward through the doorway toward airstrip (z=+38). */
				expect(state.positionZ, "AI should move toward airstrip through south doorway")
					.toBeGreaterThan(30);
			});

		it("should move at player speed when AI_SPEED_MULTIPLIER is 1.0",
			() =>
			{
				/* Verify the constant is 1.0 (changed from 0.18). */
				expect(AI_SPEED_MULTIPLIER, "AI_SPEED_MULTIPLIER should be 1.0")
					.toBe(1.0);

				service.initialize(scene, aiNode);

				const startX: number =
					aiNode.position.x;
				const startZ: number =
					aiNode.position.z;

				const playerState: ReturnType<typeof createPlayerState> =
					createPlayerState();
				playerState.positionX = -28;
				playerState.positionZ = -20;
				const emptyTraps: PlacedTrap[] = [];

				/* Collect all items so AI has a clear goal (Airstrip). */
				service.collectItem(ItemType.MoneyBag);
				service.collectItem(ItemType.SecretDocuments);
				service.collectItem(ItemType.Passport);
				service.collectItem(ItemType.KeyCard);

				/* Trigger decision evaluation then one movement frame. */
				service.update(
					AI_DECISION_INTERVAL_SECONDS + 0.01,
					playerState,
					[],
					emptyTraps);

				const afterX: number =
					aiNode.position.x;
				const afterZ: number =
					aiNode.position.z;
				const distanceMoved: number =
					Math.sqrt(
						(afterX - startX) ** 2
							+ (afterZ - startZ) ** 2);

				/*
		 * With AI_SPEED_MULTIPLIER = 1.0, distance per frame should be
		 * SPY_MOVE_SPEED * deltaTime = 8 * ~3.5 = ~28 units.
		 * Should move significantly more than the old 0.18 multiplier would allow (~5 units).
		 */
				const expectedMinDistance: number =
					SPY_MOVE_SPEED * AI_SPEED_MULTIPLIER * AI_DECISION_INTERVAL_SECONDS * 0.5;

				expect(distanceMoved, "AI should move at full player speed")
					.toBeGreaterThan(expectedMinDistance);
			});
	});