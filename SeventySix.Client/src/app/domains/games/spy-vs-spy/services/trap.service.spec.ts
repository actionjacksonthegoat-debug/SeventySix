/**
 * Trap Service unit tests.
 * Tests trap placement, trigger detection, immunity, and cleanup.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { TRAP_TRIGGER_RADIUS } from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import {
	RoomId,
	SpyIdentity,
	TrapType
} from "@games/spy-vs-spy/models/spy-vs-spy.models";
import type { PlacedTrap } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { TrapService } from "./trap.service";

describe("TrapService",
	() =>
	{
		let service: TrapService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TrapService
						]
					});

				service =
					TestBed.inject(TrapService);
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

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("placeTrap should create a PlacedTrap entry and visible mesh",
			() =>
			{
				const result: PlacedTrap | null =
					service.placeTrap(
						{
							scene,
							roomId: RoomId.BeachShack,
							positionX: -28,
							positionZ: -20,
							placedBy: SpyIdentity.Black
						},
						TrapType.Bomb);

				expect(result, "placeTrap should return a PlacedTrap")
					.not
					.toBeNull();
				expect(result!.type)
					.toBe(TrapType.Bomb);
				expect(result!.roomId)
					.toBe(RoomId.BeachShack);
				expect(result!.placedBy)
					.toBe(SpyIdentity.Black);
				expect(result!.triggered)
					.toBe(false);
			});

		it("placeTrap should return null if room already has an active trap",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.JungleHQ,
						positionX: 0,
						positionZ: -20,
						placedBy: SpyIdentity.Black
					},
					TrapType.Bomb);

				const duplicate: PlacedTrap | null =
					service.placeTrap(
						{
							scene,
							roomId: RoomId.JungleHQ,
							positionX: 2,
							positionZ: -18,
							placedBy: SpyIdentity.White
						},
						TrapType.SpringTrap);

				expect(duplicate, "second trap in same room should be rejected")
					.toBeNull();
			});

		it("checkTriggers should return PlacedTrap when spy is within trigger radius",
			() =>
			{
				const trapX: number = 0;
				const trapZ: number = 0;

				service.placeTrap(
					{
						scene,
						roomId: RoomId.JungleHQ,
						positionX: trapX,
						positionZ: trapZ,
						placedBy: SpyIdentity.White
					},
					TrapType.Bomb);

				const halfRadius: number =
					TRAP_TRIGGER_RADIUS * 0.5;
				const triggered: PlacedTrap | null =
					service.checkTriggers(
						SpyIdentity.Black,
						trapX + halfRadius,
						trapZ);

				expect(triggered, "should trigger when within radius")
					.not
					.toBeNull();
				expect(triggered!.type)
					.toBe(TrapType.Bomb);
				expect(triggered!.triggered)
					.toBe(true);
			});

		it("checkTriggers should return null when spy is outside trigger radius",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.Watchtower,
						positionX: 28,
						positionZ: -20,
						placedBy: SpyIdentity.White
					},
					TrapType.SpringTrap);

				const farAway: number =
					TRAP_TRIGGER_RADIUS + 5;
				const result: PlacedTrap | null =
					service.checkTriggers(
						SpyIdentity.Black,
						28 + farAway,
						-20);

				expect(result, "should not trigger when outside radius")
					.toBeNull();
			});

		it("checkTriggers should trigger on own traps (no self-immunity)",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.Compound,
						positionX: 0,
						positionZ: 20,
						placedBy: SpyIdentity.Black
					},
					TrapType.Bomb);

				const result: PlacedTrap | null =
					service.checkTriggers(
						SpyIdentity.Black,
						0,
						20);

				expect(result, "spy should trigger their own traps")
					.not
					.toBeNull();
				expect(result!.triggered)
					.toBe(true);
			});

		it("checkTriggers should return null for already-triggered traps",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.CoveCave,
						positionX: -28,
						positionZ: 20,
						placedBy: SpyIdentity.White
					},
					TrapType.SpringTrap);

				/* Trigger it once. */
				service.checkTriggers(
					SpyIdentity.Black,
					-28,
					20);

				/* Try to trigger the same trap again. */
				const secondAttempt: PlacedTrap | null =
					service.checkTriggers(
						SpyIdentity.Black,
						-28,
						20);

				expect(secondAttempt, "already-triggered trap should not trigger again")
					.toBeNull();
			});

		it("getActiveTrapCount should decrement after a trap triggers",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.BeachShack,
						positionX: -28,
						positionZ: -20,
						placedBy: SpyIdentity.White
					},
					TrapType.Bomb);

				expect(service.getActiveTrapCount())
					.toBe(1);

				service.checkTriggers(
					SpyIdentity.Black,
					-28,
					-20);

				expect(service.getActiveTrapCount())
					.toBe(0);
			});

		it("reset should remove all traps",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.BeachShack,
						positionX: -28,
						positionZ: -20,
						placedBy: SpyIdentity.Black
					},
					TrapType.Bomb);

				service.placeTrap(
					{
						scene,
						roomId: RoomId.Watchtower,
						positionX: 28,
						positionZ: -20,
						placedBy: SpyIdentity.White
					},
					TrapType.SpringTrap);

				expect(service.getActiveTrapCount())
					.toBe(2);

				service.reset();

				expect(service.getActiveTrapCount())
					.toBe(0);
			});

		it("dispose should clean up without throwing",
			() =>
			{
				service.placeTrap(
					{
						scene,
						roomId: RoomId.Compound,
						positionX: 0,
						positionZ: 20,
						placedBy: SpyIdentity.Black
					},
					TrapType.SpringTrap);

				expect(
					() =>
					{
						service.dispose();
					})
					.not
					.toThrow();
			});

		it("placeTrap should pass furnitureId to PlacedTrap",
			() =>
			{
				const furnitureId: string = "desk-room1";
				const result: PlacedTrap | null =
					service.placeTrap(
						{
							scene,
							roomId: RoomId.BeachShack,
							positionX: -28,
							positionZ: -20,
							placedBy: SpyIdentity.Black
						},
						TrapType.Bomb,
						furnitureId);

				expect(result)
					.not
					.toBeNull();
				expect(result!.furnitureId)
					.toBe(furnitureId);
			});

		it("placeTrap should default furnitureId to null when omitted",
			() =>
			{
				const result: PlacedTrap | null =
					service.placeTrap(
						{
							scene,
							roomId: RoomId.BeachShack,
							positionX: -28,
							positionZ: -20,
							placedBy: SpyIdentity.White
						},
						TrapType.SpringTrap);

				expect(result)
					.not
					.toBeNull();
				expect(result!.furnitureId)
					.toBeNull();
			});

		it("should start with one of each trap type per player",
			() =>
			{
				expect(service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb))
					.toBe(true);
				expect(service.canPlaceTrap(SpyIdentity.Black, TrapType.SpringTrap))
					.toBe(true);
				expect(service.canPlaceTrap(SpyIdentity.White, TrapType.Bomb))
					.toBe(true);
				expect(service.canPlaceTrap(SpyIdentity.White, TrapType.SpringTrap))
					.toBe(true);

				const blackAvailable: TrapType[] =
					service.getAvailableTrapTypes(SpyIdentity.Black);
				const whiteAvailable: TrapType[] =
					service.getAvailableTrapTypes(SpyIdentity.White);

				expect(blackAvailable)
					.toHaveLength(2);
				expect(whiteAvailable)
					.toHaveLength(2);
			});

		it("should allow placing a trap when inventory is greater than zero",
			() =>
			{
				const canPlace: boolean =
					service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb);

				expect(canPlace)
					.toBe(true);

				service.consumeTrap(SpyIdentity.Black, TrapType.Bomb);

				const afterConsume: boolean =
					service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb);

				expect(afterConsume)
					.toBe(false);
			});

		it("should prevent placing a trap when inventory is zero",
			() =>
			{
				service.consumeTrap(SpyIdentity.Black, TrapType.Bomb);

				const canPlace: boolean =
					service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb);

				expect(canPlace)
					.toBe(false);

				const available: TrapType[] =
					service.getAvailableTrapTypes(SpyIdentity.Black);

				expect(available)
					.not
					.toContain(TrapType.Bomb);
				expect(available)
					.toContain(TrapType.SpringTrap);
			});

		it("should replenish trap after it is triggered",
			() =>
			{
				service.consumeTrap(SpyIdentity.Black, TrapType.Bomb);

				expect(service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb))
					.toBe(false);

				service.replenishTrap(SpyIdentity.Black, TrapType.Bomb);

				expect(service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb))
					.toBe(true);
			});

		it("should track trap types independently per player",
			() =>
			{
				/* Black uses Bomb, Spring still available. */
				service.consumeTrap(SpyIdentity.Black, TrapType.Bomb);

				expect(service.canPlaceTrap(SpyIdentity.Black, TrapType.Bomb))
					.toBe(false);
				expect(service.canPlaceTrap(SpyIdentity.Black, TrapType.SpringTrap))
					.toBe(true);

				/* Black uses Spring — both now empty. */
				service.consumeTrap(SpyIdentity.Black, TrapType.SpringTrap);

				expect(service.getAvailableTrapTypes(SpyIdentity.Black))
					.toHaveLength(0);

				/* Replenish Bomb — only Bomb comes back. */
				service.replenishTrap(SpyIdentity.Black, TrapType.Bomb);

				const available: TrapType[] =
					service.getAvailableTrapTypes(SpyIdentity.Black);

				expect(available)
					.toContain(TrapType.Bomb);
				expect(available)
					.not
					.toContain(TrapType.SpringTrap);

				/* White inventory should be independent and untouched. */
				expect(service.canPlaceTrap(SpyIdentity.White, TrapType.Bomb))
					.toBe(true);
				expect(service.canPlaceTrap(SpyIdentity.White, TrapType.SpringTrap))
					.toBe(true);
			});
	});