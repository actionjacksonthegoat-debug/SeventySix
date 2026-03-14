/**
 * Enemy Swarm Service unit tests.
 * Tests enemy spawning, formation, movement, and destruction.
 */

import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { ENEMY_WAVE_SIZE } from "@sandbox/constants/game.constants";
import { EnemySwarmService } from "./enemy-swarm.service";

describe("EnemySwarmService",
	() =>
	{
		let service: EnemySwarmService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				TestBed.configureTestingModule(
					{
						providers: [
							provideZonelessChangeDetection(),
							EnemySwarmService
						]
					});

				service =
					TestBed.inject(EnemySwarmService);
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

		it("should create",
			() =>
			{
				expect(service)
					.toBeTruthy();
			});

		it("should spawn enemy grid of configured dimensions",
			() =>
			{
				// Arrange & Act
				service.spawnWave(
					scene,
					1);

				// Assert
				expect(service.getActiveEnemies().length)
					.toBe(ENEMY_WAVE_SIZE);
			});

		it("should remove enemy from active list when destroyed",
			() =>
			{
				// Arrange
				service.spawnWave(
					scene,
					1);
				const enemies: unknown[] =
					service.getActiveEnemies();
				const firstEnemy: unknown =
					enemies[0];

				// Act
				service.removeEnemy(firstEnemy as ReturnType<typeof service.getActiveEnemies>[0]);

				// Assert
				expect(service.getActiveEnemies().length)
					.toBe(ENEMY_WAVE_SIZE - 1);
			});

		it("should detect when all enemies are destroyed",
			() =>
			{
				// Arrange
				service.spawnWave(
					scene,
					1);

				// Act — remove all enemies
				const enemies: ReturnType<typeof service.getActiveEnemies> =
					[...service.getActiveEnemies()];
				for (const enemy of enemies)
				{
					service.removeEnemy(enemy);
				}

				// Assert
				expect(service.isWaveComplete())
					.toBe(true);
			});

		it("should dispose existing wave when spawning a new one",
			() =>
			{
				// Arrange
				service.spawnWave(
					scene,
					1);

				// Act — spawn new wave replaces old
				service.spawnWave(
					scene,
					2);

				// Assert — should have fresh wave
				expect(service.getActiveEnemies().length)
					.toBe(ENEMY_WAVE_SIZE);
			});

		it("should report wave not complete when enemies remain",
			() =>
			{
				// Arrange
				service.spawnWave(
					scene,
					1);

				// Act — remove only one
				const enemies: ReturnType<typeof service.getActiveEnemies> =
					[...service.getActiveEnemies()];
				service.removeEnemy(enemies[0]);

				// Assert
				expect(service.isWaveComplete())
					.toBe(false);
			});
	});