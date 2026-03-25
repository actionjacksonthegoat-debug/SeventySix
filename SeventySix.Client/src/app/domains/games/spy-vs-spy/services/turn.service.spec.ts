/**
 * Turn Service unit tests.
 * Tests turn alternation, timer management, and death penalties.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	DEATH_TIMER_PENALTY_SECONDS,
	GAME_TIMER_SECONDS,
	TURN_DURATION_SECONDS
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

		it("initial turn time should equal TURN_DURATION_SECONDS",
			() =>
			{
				service.initialize();

				expect(service.turnTimeRemaining())
					.toBe(TURN_DURATION_SECONDS);
			});

		it("initial player timers should equal GAME_TIMER_SECONDS",
			() =>
			{
				service.initialize();

				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS);
			});

		it("initialize with custom duration should set player timers",
			() =>
			{
				service.initialize(120);

				expect(service.player1Timer())
					.toBe(120);
				expect(service.player2Timer())
					.toBe(120);
			});

		it("update should decrement turn time",
			() =>
			{
				service.initialize();
				service.update(1);

				expect(service.turnTimeRemaining())
					.toBe(TURN_DURATION_SECONDS - 1);
			});

		it("update should decrement active player personal timer",
			() =>
			{
				service.initialize();
				service.update(5);

				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS - 5);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS);
			});

		it("update should auto-switch turn when time expires",
			() =>
			{
				service.initialize();
				service.update(TURN_DURATION_SECONDS + 1);

				expect(service.currentTurn())
					.toBe(TurnPhase.Player2);
			});

		it("auto-switch should reset turn timer",
			() =>
			{
				service.initialize();
				service.update(TURN_DURATION_SECONDS + 1);

				expect(service.turnTimeRemaining())
					.toBe(TURN_DURATION_SECONDS);
			});

		it("switchTurn should toggle from Player1 to Player2",
			() =>
			{
				service.initialize();
				service.switchTurn();

				expect(service.currentTurn())
					.toBe(TurnPhase.Player2);
			});

		it("switchTurn should toggle from Player2 back to Player1",
			() =>
			{
				service.initialize();
				service.switchTurn();
				service.switchTurn();

				expect(service.currentTurn())
					.toBe(TurnPhase.Player1);
			});

		it("switchTurn should reset turn timer",
			() =>
			{
				service.initialize();
				service.update(5);
				service.switchTurn();

				expect(service.turnTimeRemaining())
					.toBe(TURN_DURATION_SECONDS);
			});

		it("getActiveIdentity should return Black for Player1",
			() =>
			{
				service.initialize();

				expect(service.getActiveIdentity())
					.toBe(SpyIdentity.Black);
			});

		it("getActiveIdentity should return White for Player2",
			() =>
			{
				service.initialize();
				service.switchTurn();

				expect(service.getActiveIdentity())
					.toBe(SpyIdentity.White);
			});

		it("applyDeathPenalty should deduct from Black spy timer",
			() =>
			{
				service.initialize();

				service.applyDeathPenalty(SpyIdentity.Black);

				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS - DEATH_TIMER_PENALTY_SECONDS);
			});

		it("applyDeathPenalty should deduct from White spy timer",
			() =>
			{
				service.initialize();

				service.applyDeathPenalty(SpyIdentity.White);

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
				service.switchTurn();
				service.applyDeathPenalty(SpyIdentity.Black);

				service.reset();

				expect(service.currentTurn())
					.toBe(TurnPhase.Player1);
				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS);
				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS);
			});

		it("Player2 update should decrement player2 timer",
			() =>
			{
				service.initialize();
				service.switchTurn();
				service.update(3);

				expect(service.player2Timer())
					.toBe(GAME_TIMER_SECONDS - 3);
				expect(service.player1Timer())
					.toBe(GAME_TIMER_SECONDS);
			});
	});