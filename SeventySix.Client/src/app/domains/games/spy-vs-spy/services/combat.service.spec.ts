/**
 * Combat Service unit tests.
 * Tests combat engagement, timer, resolution, and state management.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	COMBAT_DURATION_SECONDS,
	COMBAT_ENGAGE_RADIUS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { CombatResult } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { CombatService } from "./combat.service";

describe("CombatService",
	() =>
	{
		let service: CombatService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							CombatService
						]
					});

				service =
					TestBed.inject(CombatService);
			});

		it("should be created",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		describe("canEngage",
			() =>
			{
				it("should return true when spies are within engage radius",
					() =>
					{
						const halfRadius: number =
							COMBAT_ENGAGE_RADIUS * 0.5;

						expect(service.canEngage(0, 0, halfRadius, 0))
							.toBe(true);
					});

				it("should return true when spies are at same position",
					() =>
					{
						expect(service.canEngage(10, 20, 10, 20))
							.toBe(true);
					});

				it("should return false when spies are far apart",
					() =>
					{
						expect(service.canEngage(0, 0, 100, 100))
							.toBe(false);
					});

				it("should return true at exact engage radius boundary",
					() =>
					{
						expect(service.canEngage(0, 0, COMBAT_ENGAGE_RADIUS, 0))
							.toBe(true);
					});

				it("should return false just beyond engage radius",
					() =>
					{
						const justBeyond: number =
							COMBAT_ENGAGE_RADIUS + 0.01;

						expect(service.canEngage(0, 0, justBeyond, 0))
							.toBe(false);
					});
			});

		describe("startCombat",
			() =>
			{
				it("should set isInCombat to true",
					() =>
					{
						service.startCombat();

						expect(service.isInCombat())
							.toBe(true);
					});

				it("should set combat timer to duration",
					() =>
					{
						service.startCombat();

						expect(service.combatTimer())
							.toBe(COMBAT_DURATION_SECONDS);
					});

				it("should clear last result",
					() =>
					{
						service.startCombat();

						expect(service.lastResult())
							.toBeNull();
					});
			});

		describe("update",
			() =>
			{
				it("should return false when not in combat",
					() =>
					{
						const finished: boolean =
							service.update(1);

						expect(finished)
							.toBe(false);
					});

				it("should decrement combat timer",
					() =>
					{
						service.startCombat();
						service.update(0.5);

						expect(service.combatTimer())
							.toBe(COMBAT_DURATION_SECONDS - 0.5);
					});

				it("should return false when timer not expired",
					() =>
					{
						service.startCombat();

						const finished: boolean =
							service.update(0.5);

						expect(finished)
							.toBe(false);
					});

				it("should return true when timer expires",
					() =>
					{
						service.startCombat();

						const finished: boolean =
							service.update(COMBAT_DURATION_SECONDS + 1);

						expect(finished)
							.toBe(true);
					});

				it("should clamp timer to zero",
					() =>
					{
						service.startCombat();
						service.update(COMBAT_DURATION_SECONDS + 5);

						expect(service.combatTimer())
							.toBe(0);
					});
			});

		describe("resolve",
			() =>
			{
				it("should return either Player1Wins or Player2Wins (dice roll)",
					() =>
					{
						service.startCombat();

						const result: CombatResult =
							service.resolve();

						expect(
							[CombatResult.Player1Wins, CombatResult.Player2Wins])
							.toContain(result);
					});

				it("should set lastResult signal after resolve",
					() =>
					{
						service.startCombat();
						service.resolve();

						expect(service.lastResult())
							.not
							.toBeNull();
					});

				it("should set isInCombat to false after resolve",
					() =>
					{
						service.startCombat();
						service.resolve();

						expect(service.isInCombat())
							.toBe(false);
					});

				it("should reset combat timer after resolve",
					() =>
					{
						service.startCombat();
						service.resolve();

						expect(service.combatTimer())
							.toBe(0);
					});
			});

		describe("reset",
			() =>
			{
				it("should clear combat active state",
					() =>
					{
						service.startCombat();
						service.reset();

						expect(service.isInCombat())
							.toBe(false);
					});

				it("should clear last result",
					() =>
					{
						service.startCombat();
						service.resolve();
						service.reset();

						expect(service.lastResult())
							.toBeNull();
					});

				it("should reset combat timer",
					() =>
					{
						service.startCombat();
						service.reset();

						expect(service.combatTimer())
							.toBe(0);
					});
			});

		describe("dispose",
			() =>
			{
				it("should clear all state",
					() =>
					{
						service.startCombat();
						service.dispose();

						expect(service.isInCombat())
							.toBe(false);
						expect(service.lastResult())
							.toBeNull();
						expect(service.combatTimer())
							.toBe(0);
					});

				it("should not throw when called before use",
					() =>
					{
						expect(
							() => service.dispose())
							.not
							.toThrow();
					});
			});

		describe("initial state",
			() =>
			{
				it("should not be in combat initially",
					() =>
					{
						expect(service.isInCombat())
							.toBe(false);
					});

				it("should have null last result initially",
					() =>
					{
						expect(service.lastResult())
							.toBeNull();
					});

				it("should have zero timer initially",
					() =>
					{
						expect(service.combatTimer())
							.toBe(0);
					});
			});
	});