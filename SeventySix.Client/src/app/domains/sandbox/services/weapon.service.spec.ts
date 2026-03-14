/**
 * Weapon Service unit tests.
 */

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { type Projectile, WeaponType } from "@sandbox/models/game.models";
import { WeaponService } from "./weapon.service";

describe("WeaponService",
	() =>
	{
		let service: WeaponService;
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
					new WeaponService();
			});

		afterEach(
			() =>
			{
				service.dispose();
				scene.dispose();
				engine.dispose();
			});

		it("should initialize with MachineGun weapon type",
			() =>
			{
				expect(service.getCurrentWeapon())
					.toBe(WeaponType.MachineGun);
			});

		it("should enforce fire rate cooldown between shots",
			() =>
			{
				// Arrange
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				// Act — fire twice immediately
				const first: Projectile[] | null =
					service.fire(
						scene,
						position,
						direction);
				const second: Projectile[] | null =
					service.fire(
						scene,
						position,
						direction);

				// Assert
				expect(first)
					.not
					.toBeNull();
				expect(second)
					.toBeNull();
			});

		it("should create projectile with correct velocity and direction",
			() =>
			{
				// Arrange
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				// Act
				service.fire(
					scene,
					position,
					direction);

				// Assert
				const projectiles: Projectile[] =
					service.getActiveProjectiles();
				expect(projectiles.length)
					.toBe(1);
				expect(projectiles[0].direction.z)
					.toBeGreaterThan(0);
			});

		it("should remove projectiles that exceed max range",
			() =>
			{
				// Arrange
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				service.fire(
					scene,
					position,
					direction);

				// Act — simulate many seconds to exceed max range
				service.update(10);

				// Assert
				expect(service.getActiveProjectiles().length)
					.toBe(0);
			});

		it("should switch weapon type when setWeapon is called",
			() =>
			{
				// Act
				service.setWeapon(WeaponType.SpreadGun);

				// Assert
				expect(service.getCurrentWeapon())
					.toBe(WeaponType.SpreadGun);
			});

		it("should apply correct damage for each weapon type",
			() =>
			{
				// Arrange
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				// Act — fire with machine gun
				service.fire(
					scene,
					position,
					direction);

				// Assert
				const projectiles: Projectile[] =
					service.getActiveProjectiles();
				expect(projectiles[0].damage)
					.toBe(1);
			});

		it("should fire 5 projectiles in fan pattern for SpreadGun",
			() =>
			{
				// Arrange
				service.setWeapon(WeaponType.SpreadGun);
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				// Act
				const result: Projectile[] | null =
					service.fire(
						scene,
						position,
						direction);

				// Assert
				expect(result)
					.not
					.toBeNull();
				expect(result!.length)
					.toBe(5);
				expect(service.getActiveProjectiles().length)
					.toBe(5);
			});

		it("should create piercing projectile for Laser",
			() =>
			{
				// Arrange
				service.setWeapon(WeaponType.Laser);
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				// Act
				service.fire(
					scene,
					position,
					direction);

				// Assert
				const projectiles: Projectile[] =
					service.getActiveProjectiles();
				expect(projectiles[0].piercing)
					.toBe(true);
				expect(projectiles[0].damage)
					.toBe(2);
			});

		it("should apply correct damage for RapidFire",
			() =>
			{
				// Arrange
				service.setWeapon(WeaponType.RapidFire);
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);

				// Act
				service.fire(
					scene,
					position,
					direction);

				// Assert
				const projectiles: Projectile[] =
					service.getActiveProjectiles();
				expect(projectiles[0].damage)
					.toBe(1);
			});

		it("should clear all projectiles on dispose",
			() =>
			{
				// Arrange
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);
				service.fire(
					scene,
					position,
					direction);

				// Act
				service.dispose();

				// Assert
				expect(service.getActiveProjectiles().length)
					.toBe(0);
			});

		it("should reset weapon to MachineGun on dispose",
			() =>
			{
				// Arrange
				service.setWeapon(WeaponType.Laser);

				// Act
				service.dispose();

				// Assert
				expect(service.getCurrentWeapon())
					.toBe(WeaponType.MachineGun);
			});

		it("should remove specific projectile when removeProjectile is called",
			() =>
			{
				// Arrange
				const position: Vector3 =
					Vector3.Zero();
				const direction: Vector3 =
					new Vector3(
						0,
						0,
						1);
				service.fire(
					scene,
					position,
					direction);
				const projectile: Projectile =
					service.getActiveProjectiles()[0];

				// Act
				service.removeProjectile(projectile);

				// Assert
				expect(service.getActiveProjectiles().length)
					.toBe(0);
			});
	});