/**
 * Boss Service unit tests.
 */

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { BossService } from "./boss.service";

describe("BossService",
	() =>
	{
		let service: BossService;
		let engine: NullEngine;
		let scene: Scene;

		beforeEach(
			() =>
			{
				engine =
					new NullEngine();
				scene =
					new Scene(engine);
				service =
					new BossService();
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

		it("should spawn boss with 10 eye tentacles",
			() =>
			{
				// Act
				service.spawnBoss(scene);

				// Assert
				expect(service.isAlive())
					.toBe(true);
				expect(service.getRemainingEyes())
					.toBe(10);
			});

		it("should destroy individual eye on hit",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);

				// Act
				service.damageEye(0);

				// Assert
				expect(service.getRemainingEyes())
					.toBe(9);
			});

		it("should enter rage mode when half eyes destroyed",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);

				// Act — destroy 5 eyes
				for (let idx: number = 0; idx < 5; idx++)
				{
					service.damageEye(idx);
				}

				// Assert
				expect(service.isRageMode())
					.toBe(true);
			});

		it("should die when all eyes are destroyed",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);

				// Act — destroy all 10 eyes
				for (let idx: number = 0; idx < 10; idx++)
				{
					service.damageEye(idx);
				}

				// Assert
				expect(service.isAlive())
					.toBe(false);
				expect(service.getRemainingEyes())
					.toBe(0);
			});

		it("should not enter rage mode before half eyes destroyed",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);

				// Act — destroy only 4 eyes
				for (let idx: number = 0; idx < 4; idx++)
				{
					service.damageEye(idx);
				}

				// Assert
				expect(service.isRageMode())
					.toBe(false);
			});

		it("should update boss position toward player",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);
				const initialZ: number =
					service.getBossPosition().z;

				// Act
				service.update(
					1,
					Vector3.Zero());

				// Assert
				expect(service.getBossPosition().z)
					.toBeLessThan(initialZ);
			});

		it("should ignore damage to invalid eye index",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);

				// Act — negative index
				service.damageEye(-1);

				// Assert — no eyes damaged
				expect(service.getRemainingEyes())
					.toBe(10);
			});

		it("should ignore damage to already destroyed eye",
			() =>
			{
				// Arrange
				service.spawnBoss(scene);
				service.damageEye(0);

				// Act — damage same eye again
				service.damageEye(0);

				// Assert — only 1 eye lost
				expect(service.getRemainingEyes())
					.toBe(9);
			});

		it("should return zero position before spawn",
			() =>
			{
				// Act
				const position: Vector3 =
					service.getBossPosition();

				// Assert
				expect(position.x)
					.toBe(0);
				expect(position.y)
					.toBe(0);
				expect(position.z)
					.toBe(0);
			});

		it("should not update when boss is dead",
			() =>
			{
				// Arrange — spawn and kill boss
				service.spawnBoss(scene);
				for (let idx: number = 0; idx < 10; idx++)
				{
					service.damageEye(idx);
				}
				const posAfterDeath: Vector3 =
					service.getBossPosition();

				// Act
				service.update(
					1,
					Vector3.Zero());

				// Assert — position unchanged
				expect(service.getBossPosition().z)
					.toBe(posAfterDeath.z);
			});
	});