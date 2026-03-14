/**
 * Power-Up Service unit tests.
 */

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { type PowerUpInstance, PowerUpType } from "@sandbox/models/game.models";
import { PowerUpService } from "./powerup.service";

describe("PowerUpService",
	() =>
	{
		let service: PowerUpService;
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
					new PowerUpService();
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should spawn power-up every N kills",
			() =>
			{
				// Act
				service.checkSpawn(
					15,
					0,
					scene,
					Vector3.Zero());

				// Assert
				expect(service.getActivePowerUps().length)
					.toBe(1);
			});

		it("should not spawn if kill threshold not reached",
			() =>
			{
				// Act
				service.checkSpawn(
					10,
					0,
					scene,
					Vector3.Zero());

				// Assert
				expect(service.getActivePowerUps().length)
					.toBe(0);
			});

		it("should remove power-up after collection",
			() =>
			{
				// Arrange
				service.spawnPowerUp(
					scene,
					Vector3.Zero());
				const powerUps: PowerUpInstance[] =
					service.getActivePowerUps();

				// Act
				service.collectPowerUp(powerUps[0]);

				// Assert
				expect(service.getActivePowerUps().length)
					.toBe(0);
			});

		it("should remove power-up after timeout",
			() =>
			{
				// Arrange
				service.spawnPowerUp(
					scene,
					Vector3.Zero());

				// Act — simulate 15 seconds (beyond 10s timeout)
				service.update(15);

				// Assert
				expect(service.getActivePowerUps().length)
					.toBe(0);
			});

		it("should return collected power-up type",
			() =>
			{
				// Arrange
				service.spawnPowerUp(
					scene,
					Vector3.Zero(),
					PowerUpType.SpreadGun);
				const powerUps: PowerUpInstance[] =
					service.getActivePowerUps();

				// Act
				const type: PowerUpType =
					service.collectPowerUp(powerUps[0]);

				// Assert
				expect(type)
					.toBe(PowerUpType.SpreadGun);
			});

		it("should select random power-up type when none specified",
			() =>
			{
				// Act
				service.spawnPowerUp(
					scene,
					Vector3.Zero());

				// Assert
				const powerUps: PowerUpInstance[] =
					service.getActivePowerUps();
				expect(powerUps[0].type)
					.toBeDefined();
			});
	});