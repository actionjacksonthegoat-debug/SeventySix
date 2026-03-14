/**
 * Game State Service unit tests.
 * Tests state machine transitions and transition validation.
 */

import {
	effect,
	type EffectRef,
	provideZonelessChangeDetection
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { GameState } from "@sandbox/models/game.models";
import { GameStateService } from "./game-state.service";

describe("GameStateService",
	() =>
	{
		let service: GameStateService;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							GameStateService
						]
					});

				service =
					TestBed.inject(GameStateService);
			});

		it("should start in Title state",
			() =>
			{
				expect(service.currentState())
					.toBe(GameState.Title);
			});

		it("should transition from Title to Playing on start",
			() =>
			{
				// Act
				service.start();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Playing);
			});

		it("should transition from Playing to Paused on pause",
			() =>
			{
				// Arrange
				service.start();

				// Act
				service.pause();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Paused);
			});

		it("should transition from Paused to Playing on pause",
			() =>
			{
				// Arrange
				service.start();
				service.pause();

				// Act
				service.pause();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Playing);
			});

		it("should transition from Playing to GameOver on last life lost",
			() =>
			{
				// Arrange
				service.start();

				// Act
				service.gameOver();

				// Assert
				expect(service.currentState())
					.toBe(GameState.GameOver);
			});

		it("should transition from GameOver to Playing on continue",
			() =>
			{
				// Arrange
				service.start();
				service.gameOver();

				// Act
				service.continueGame();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Playing);
			});

		it("should transition from Playing to Victory on boss defeat",
			() =>
			{
				// Arrange
				service.start();

				// Act
				service.victory();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Victory);
			});

		it("should not allow invalid state transitions",
			() =>
			{
				// Arrange — Title state
				const result: boolean =
					service.transition(GameState.GameOver);

				// Assert — cannot go from Title directly to GameOver
				expect(result)
					.toBe(false);
				expect(service.currentState())
					.toBe(GameState.Title);
			});

		it("should emit state change signals",
			() =>
			{
				// Arrange
				const states: GameState[] = [];
				const unwatch: EffectRef =
					TestBed.runInInjectionContext(
						() =>
							effect(
								() =>
								{
									states.push(service.currentState());
								}));

				// Act
				service.start();
				TestBed.flushEffects();

				// Assert — should have Title (initial) and Playing
				expect(states)
					.toContain(GameState.Playing);

				unwatch.destroy();
			});

		it("should not allow pause from Title state",
			() =>
			{
				// Act
				service.pause();

				// Assert — stays at Title
				expect(service.currentState())
					.toBe(GameState.Title);
			});

		it("should not allow pause from GameOver state",
			() =>
			{
				// Arrange
				service.start();
				service.gameOver();

				// Act
				service.pause();

				// Assert — stays at GameOver
				expect(service.currentState())
					.toBe(GameState.GameOver);
			});

		it("should reset to Title from any state",
			() =>
			{
				// Arrange — go to Playing → GameOver
				service.start();
				service.gameOver();

				// Act
				service.reset();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Title);
			});

		it("should transition from Victory to Title on reset",
			() =>
			{
				// Arrange
				service.start();
				service.victory();

				// Act
				service.reset();

				// Assert
				expect(service.currentState())
					.toBe(GameState.Title);
			});
	});