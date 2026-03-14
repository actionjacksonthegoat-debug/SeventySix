/**
 * Weapon Service.
 * Manages projectile creation, fire rate cooldown, and weapon type switching.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import {
	PROJECTILE_SPEED,
	WEAPON_LASER_DAMAGE,
	WEAPON_MACHINE_GUN_DAMAGE,
	WEAPON_MACHINE_GUN_FIRE_RATE,
	WEAPON_RAPID_FIRE_DAMAGE,
	WEAPON_RAPID_FIRE_RATE,
	WEAPON_SPREAD_ANGLE,
	WEAPON_SPREAD_GUN_DAMAGE,
	WEAPON_SPREAD_GUN_FIRE_RATE,
	WORLD_BOUND_Z
} from "@sandbox/constants/game.constants";
import { type Projectile, type ProjectileOptions, WeaponType } from "@sandbox/models/game.models";

/**
 * Service responsible for weapon firing, projectile lifecycle, and weapon switching.
 */
@Injectable()
export class WeaponService
{
	/**
	 * Currently equipped weapon type.
	 * @type {WeaponType}
	 * @private
	 */
	private currentWeapon: WeaponType =
		WeaponType.MachineGun;

	/**
	 * Active projectiles in the game world.
	 * @type {Projectile[]}
	 * @private
	 */
	private projectiles: Projectile[] = [];

	/**
	 * Time of last shot in milliseconds.
	 * @type {number}
	 * @private
	 */
	private lastFireTime: number = 0;

	/**
	 * Maximum projectile travel distance.
	 * @type {number}
	 * @private
	 */
	private readonly maxRange: number = WORLD_BOUND_Z;

	/**
	 * Returns the currently equipped weapon type.
	 * @returns {WeaponType}
	 * The active weapon type.
	 */
	getCurrentWeapon(): WeaponType
	{
		return this.currentWeapon;
	}

	/**
	 * Switches to a different weapon type.
	 * @param {WeaponType} type
	 * The weapon type to switch to.
	 */
	setWeapon(type: WeaponType): void
	{
		this.currentWeapon = type;
	}

	/**
	 * Fires the current weapon from the given position and direction.
	 * Returns null if the fire rate cooldown has not elapsed.
	 * @param {Scene} scene
	 * The Babylon.js scene to create projectile meshes in.
	 * @param {Vector3} position
	 * The firing position (ship nose).
	 * @param {Vector3} direction
	 * The firing direction (ship facing).
	 * @returns {Projectile[] | null}
	 * Created projectiles or null if on cooldown.
	 */
	fire(
		scene: Scene,
		position: Vector3,
		direction: Vector3): Projectile[] | null
	{
		const now: number =
			performance.now();
		const cooldown: number =
			this.getCooldownMs();

		if (now - this.lastFireTime < cooldown)
		{
			return null;
		}

		this.lastFireTime = now;

		const created: Projectile[] =
			this.createWeaponProjectiles(
				scene,
				position,
				direction);

		this.projectiles.push(...created);
		return created;
	}

	/**
	 * Creates projectiles for the currently equipped weapon type.
	 * @param {Scene} scene
	 * The Babylon.js scene.
	 * @param {Vector3} position
	 * The firing position.
	 * @param {Vector3} direction
	 * The firing direction.
	 * @returns {Projectile[]}
	 * Created projectile instances.
	 * @private
	 */
	private createWeaponProjectiles(
		scene: Scene,
		position: Vector3,
		direction: Vector3): Projectile[]
	{
		switch (this.currentWeapon)
		{
			case WeaponType.SpreadGun:
				return this.fireSpread(
					scene,
					position,
					direction);

			case WeaponType.Laser:
				return [this.createProjectile(
					{
						scene,
						position,
						direction,
						damage: WEAPON_LASER_DAMAGE,
						piercing: true,
						color: new Color3(
							0.2,
							0.4,
							1)
					})];

			case WeaponType.RapidFire:
				return [this.createProjectile(
					{
						scene,
						position,
						direction,
						damage: WEAPON_RAPID_FIRE_DAMAGE,
						piercing: false,
						color: new Color3(
							0.2,
							1,
							0.3)
					})];

			default:
				return [this.createProjectile(
					{
						scene,
						position,
						direction,
						damage: WEAPON_MACHINE_GUN_DAMAGE,
						piercing: false,
						color: new Color3(
							1,
							0.9,
							0.3)
					})];
		}
	}

	/**
	 * Updates all active projectiles. Moves them forward and removes expired ones.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 */
	update(deltaTime: number): void
	{
		const toRemove: number[] = [];

		for (let idx: number =
			this.projectiles.length - 1; idx >= 0; idx--)
		{
			const projectile: Projectile =
				this.projectiles[idx];
			const movement: number =
				projectile.speed * deltaTime;

			projectile.mesh.position.addInPlace(
				projectile.direction.scale(movement));
			projectile.distanceTraveled += movement;

			if (projectile.distanceTraveled >= this.maxRange)
			{
				toRemove.push(idx);
			}
		}

		for (const idx of toRemove)
		{
			this.projectiles[idx].mesh.dispose();
			this.projectiles.splice(
				idx,
				1);
		}
	}

	/**
	 * Returns all currently active projectiles.
	 * @returns {Projectile[]}
	 * Array of active projectile instances.
	 */
	getActiveProjectiles(): Projectile[]
	{
		return this.projectiles;
	}

	/**
	 * Removes a specific projectile and disposes its mesh.
	 * @param {Projectile} projectile
	 * The projectile to remove.
	 */
	removeProjectile(projectile: Projectile): void
	{
		const index: number =
			this.projectiles.indexOf(projectile);

		if (index >= 0)
		{
			projectile.mesh.dispose();
			this.projectiles.splice(
				index,
				1);
		}
	}

	/**
	 * Disposes all active projectiles and resets state.
	 */
	dispose(): void
	{
		for (const projectile of this.projectiles)
		{
			projectile.mesh.dispose();
		}

		this.projectiles = [];
		this.currentWeapon =
			WeaponType.MachineGun;
		this.lastFireTime = 0;
	}

	/**
	 * Returns the fire rate cooldown in milliseconds for the current weapon.
	 * @returns {number}
	 * Cooldown duration in milliseconds.
	 * @private
	 */
	private getCooldownMs(): number
	{
		switch (this.currentWeapon)
		{
			case WeaponType.SpreadGun:
				return 1000 / WEAPON_SPREAD_GUN_FIRE_RATE;

			case WeaponType.RapidFire:
				return 1000 / WEAPON_RAPID_FIRE_RATE;

			case WeaponType.Laser:
				return 500;

			default:
				return 1000 / WEAPON_MACHINE_GUN_FIRE_RATE;
		}
	}

	/**
	 * Fires a spread pattern of 5 projectiles.
	 * @param {Scene} scene
	 * The Babylon.js scene.
	 * @param {Vector3} position
	 * The firing position.
	 * @param {Vector3} direction
	 * The central firing direction.
	 * @returns {Projectile[]}
	 * Array of created projectiles.
	 * @private
	 */
	private fireSpread(
		scene: Scene,
		position: Vector3,
		direction: Vector3): Projectile[]
	{
		const spreadProjectiles: Projectile[] = [];
		const angles: number[] =
			[
				-WEAPON_SPREAD_ANGLE,
				-WEAPON_SPREAD_ANGLE / 2,
				0,
				WEAPON_SPREAD_ANGLE / 2,
				WEAPON_SPREAD_ANGLE
			];

		const color: Color3 =
			new Color3(
				1,
				0.5,
				0.2);

		for (const angle of angles)
		{
			const rotatedDirection: Vector3 =
				new Vector3(
					direction.x + Math.sin(angle),
					direction.y,
					direction.z * Math.cos(angle));

			rotatedDirection
				.normalize();

			spreadProjectiles.push(
				this.createProjectile(
					{
						scene,
						position: position.clone(),
						direction: rotatedDirection,
						damage: WEAPON_SPREAD_GUN_DAMAGE,
						piercing: false,
						color
					}));
		}

		return spreadProjectiles;
	}

	/**
	 * Creates a single projectile mesh and instance.
	 * @param {ProjectileOptions} options
	 * Projectile creation options.
	 * @returns {Projectile}
	 * The created projectile instance.
	 * @private
	 */
	private createProjectile(options: ProjectileOptions): Projectile
	{
		const mesh: Mesh =
			MeshBuilder.CreateBox(
				"projectile",
				{
					width: 0.1,
					height: 0.1,
					depth: 0.4
				},
				options.scene);

		mesh.position =
			options.position.clone();

		const material: StandardMaterial =
			new StandardMaterial(
				"projectileMat",
				options.scene);

		material.emissiveColor =
			options.color;
		material.disableLighting = true;
		mesh.material = material;

		return {
			mesh,
			direction: options
				.direction
				.normalize(),
			speed: PROJECTILE_SPEED,
			damage: options.damage,
			distanceTraveled: 0,
			piercing: options.piercing
		};
	}
}