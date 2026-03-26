/**
 * Turn Service unit tests.
 * Tests shared island timer management and death penalties.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	DEATH_TIMER_PENALTY_SECONDS,
	GAME_TIMER_SECONDS
} from "@games/spy-vs-spy/constants/spy-vs-spy.constants";
import { SpyIdentity, TurnPhase } from "@games/spy-vs-spy/models/spy-vs-spy.models";
import { TurnService } from "./turn.service";

describe("TurnService",
	() =>
	{
		let service: TurnService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							TurnService
						]
					});

				service =
					TestBed.inject(TurnService);
			});

		afterEach(
			() =>
			{
				service.dispose();
			});

		it("should create without throwing",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("initial turn should be Player1",
			() =>
			{
				service.initialize();

				expect(service.currentTurn())
					.toBe(TurnPhase.Player1);
			});

		it("turn time should remain zero in single-player mode",
			() =>
			{
				service.initialize();

				expect(service.turnTimeRemaining())
					.toBe(0);
			});

		it("initial timers should equal GAME_TIMER_SECONDS",
			() =>
			{
				service.initialize();

				expect(service.islandTimer())
					.toBe(GAME_TIMER_SECONDS);
				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS);
			});

		it("initialize with custom duration should set island timer",
			() =>
			{
				service.initialize(120);

				expect(service.islandTimer())
					.toBe(120);
				expect(service.player1Timer())
					.toBe(120);
				expect(service.player2Timer())
					.toBe(120);
			});

		it("update should decrement island timer",
			() =>
			{
				service.initialize();
				service.update(1);

				expect(service.islandTimer())
					.toBe(GAME_TIMER_SECONDS - 1);
				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS - 1);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS - 1);
			});

		it("switchTurn should be a no-op in single-player mode",
			() =>
			{
				service.initialize();
				service.switchTurn();

				expect(service.currentTurn())
					.toBe(TurnPhase.Player1);
			});

		it("getActiveIdentity should return Black for Player1",
			() =>
			{
				service.initialize();

				expect(service.getActiveIdentity())
					.toBe(SpyIdentity.Black);
			});

		it("applyDeathPenalty should deduct from shared timer",
			() =>
			{
				service.initialize();

				service.applyDeathPenalty(SpyIdentity.Black);

				expect(service.islandTimer())
					.toBe(GAME_TIMER_SECONDS - DEATH_TIMER_PENALTY_SECONDS);
				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS - DEATH_TIMER_PENALTY_SECONDS);
			});

		it("applyDeathPenalty should ignore identity in shared mode",
			() =>
			{
				service.initialize();

				service.applyDeathPenalty(SpyIdentity.White);

				expect(service.islandTimer())
					.toBe(GAME_TIMER_SECONDS - DEATH_TIMER_PENALTY_SECONDS);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS - DEATH_TIMER_PENALTY_SECONDS);
			});

		it("applyDeathPenalty should not go below zero",
			() =>
			{
				service.initialize(10);

				service.applyDeathPenalty(SpyIdentity.Black);

				expect(service.player1Timer())
					.toBe(0);
			});

		it("isTimerExpired should return false initially",
			() =>
			{
				service.initialize();

				expect(service.isTimerExpired(SpyIdentity.Black))
					.toBe(false);
				expect(service.isTimerExpired(SpyIdentity.White))
					.toBe(false);
			});

		it("isTimerExpired should return true when timer reaches zero",
			() =>
			{
				service.initialize(10);

				service.applyDeathPenalty(SpyIdentity.Black);

				expect(service.isTimerExpired(SpyIdentity.Black))
					.toBe(true);
			});

		it("reset should restore all timers",
			() =>
			{
				service.initialize();
				service.applyDeathPenalty(SpyIdentity.Black);

				service.reset();

				expect(service.islandTimer())
					.toBe(GAME_TIMER_SECONDS);
				expect(service.currentTurn())
					.toBe(TurnPhase.Player1);
				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS);
			});
	});