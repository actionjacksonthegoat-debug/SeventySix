/**
 * Player Ship Service.
 * Creates and manages the X-Wing fighter mesh and flight physics.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/boxBuilder";
import "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import {
	PLAYER_SPEED,
	PLAYER_TURN_RATE,
	WORLD_BOUND_X,
	WORLD_BOUND_Y
} from "@sandbox/constants/game.constants";

/**
 * Service responsible for creating and managing the player's X-Wing fighter.
 * Handles mesh creation, flight physics, and disposal.
 */
@Injectable()
export class PlayerShipService
{
	/**
	 * Root transform node for the ship hierarchy.
	 * @type {TransformNode | null}
	 * @private
	 */
	private shipRoot: TransformNode | null = null;

	/**
	 * Array of child meshes for cleanup.
	 * @type {Mesh[]}
	 * @private
	 */
	private shipMeshes: Mesh[] = [];

	/**
	 * Creates the X-Wing fighter mesh from Babylon.js primitives.
	 * @param {Scene} scene
	 * The Babylon.js scene to add the ship to.
	 * @returns {TransformNode}
	 * The root transform node containing the complete ship.
	 */
	createShip(scene: Scene): TransformNode
	{
		this.shipRoot =
			new TransformNode(
				"xwing",
				scene);

		this.createFuselage(scene);
		this.createWings(scene);
		this.createEngineNacelles(scene);
		this.createCockpit(scene);

		return this.shipRoot;
	}

	/**
	 * Returns the ship's root transform node.
	 * @returns {TransformNode | null}
	 * The ship root or null if not created.
	 */
	getShipMesh(): TransformNode | null
	{
		return this.shipRoot;
	}

	/**
	 * Updates ship position based on input state.
	 * @param {Record<string, boolean>} keys
	 * Current keyboard state from the input service.
	 * @param {number} deltaTime
	 * Time since last frame in seconds.
	 */
	updateFlight(
		keys: Record<string, boolean>,
		deltaTime: number): void
	{
		if (this.shipRoot === null)
		{
			return;
		}

		const moveSpeed: number =
			PLAYER_SPEED * deltaTime;
		const turnSpeed: number =
			PLAYER_TURN_RATE * deltaTime;

		this.updateVerticalMovement(
			keys,
			moveSpeed,
			turnSpeed);
		this.updateHorizontalMovement(
			keys,
			moveSpeed,
			turnSpeed);
		this.clampPosition();
	}

	/**
	 * Applies vertical movement and pitch rotation based on W/S keys.
	 * @param {Record<string, boolean>} keys
	 * Current keyboard state.
	 * @param {number} moveSpeed
	 * Scaled movement speed.
	 * @param {number} turnSpeed
	 * Scaled turn rate.
	 * @private
	 */
	private updateVerticalMovement(
		keys: Record<string, boolean>,
		moveSpeed: number,
		turnSpeed: number): void
	{
		if (keys["w"] === true || keys["W"] === true)
		{
			this.shipRoot!.position.y += moveSpeed;
			this.shipRoot!.rotation.x =
				this.lerpAngle(
					this.shipRoot!.rotation.x,
					-0.3,
					turnSpeed);
		}
		else if (keys["s"] === true || keys["S"] === true)
		{
			this.shipRoot!.position.y -= moveSpeed;
			this.shipRoot!.rotation.x =
				this.lerpAngle(
					this.shipRoot!.rotation.x,
					0.3,
					turnSpeed);
		}
		else
		{
			this.shipRoot!.rotation.x =
				this.lerpAngle(
					this.shipRoot!.rotation.x,
					0,
					turnSpeed);
		}
	}

	/**
	 * Applies horizontal movement and roll rotation based on A/D keys.
	 * @param {Record<string, boolean>} keys
	 * Current keyboard state.
	 * @param {number} moveSpeed
	 * Scaled movement speed.
	 * @param {number} turnSpeed
	 * Scaled turn rate.
	 * @private
	 */
	private updateHorizontalMovement(
		keys: Record<string, boolean>,
		moveSpeed: number,
		turnSpeed: number): void
	{
		if (keys["a"] === true || keys["A"] === true)
		{
			this.shipRoot!.position.x -= moveSpeed;
			this.shipRoot!.rotation.z =
				this.lerpAngle(
					this.shipRoot!.rotation.z,
					0.4,
					turnSpeed);
		}
		else if (keys["d"] === true || keys["D"] === true)
		{
			this.shipRoot!.position.x += moveSpeed;
			this.shipRoot!.rotation.z =
				this.lerpAngle(
					this.shipRoot!.rotation.z,
					-0.4,
					turnSpeed);
		}
		else
		{
			this.shipRoot!.rotation.z =
				this.lerpAngle(
					this.shipRoot!.rotation.z,
					0,
					turnSpeed);
		}
	}

	/**
	 * Disposes all ship meshes and resources.
	 */
	dispose(): void
	{
		for (const mesh of this.shipMeshes)
		{
			mesh.dispose();
		}

		this.shipMeshes = [];

		if (this.shipRoot !== null)
		{
			this.shipRoot.dispose();
			this.shipRoot = null;
		}
	}

	/**
	 * Linearly interpolates between two angles.
	 * @param {number} current
	 * The current angle.
	 * @param {number} target
	 * The target angle.
	 * @param {number} factor
	 * Interpolation factor (0-1).
	 * @returns {number}
	 * The interpolated angle.
	 * @private
	 */
	private lerpAngle(
		current: number,
		target: number,
		factor: number): number
	{
		return current + (target - current) * Math.min(
			factor,
			1);
	}

	/**
	 * Clamps the ship position within world bounds.
	 * @private
	 */
	private clampPosition(): void
	{
		if (this.shipRoot === null)
		{
			return;
		}

		this.shipRoot.position.x =
			Math.max(
				-WORLD_BOUND_X,
				Math.min(
					WORLD_BOUND_X,
					this.shipRoot.position.x));

		this.shipRoot.position.y =
			Math.max(
				-WORLD_BOUND_Y,
				Math.min(
					WORLD_BOUND_Y,
					this.shipRoot.position.y));
	}

	/**
	 * Creates the main fuselage body of the X-Wing.
	 * @param {Scene} scene
	 * The scene to add the fuselage to.
	 * @private
	 */
	private createFuselage(scene: Scene): void
	{
		const fuselage: Mesh =
			MeshBuilder.CreateBox(
				"fuselage",
				{
					width: 0.6,
					height: 0.4,
					depth: 3
				},
				scene);

		const hullMaterial: StandardMaterial =
			new StandardMaterial(
				"hullMaterial",
				scene);
		hullMaterial.diffuseColor =
			new Color3(
				0.85,
				0.85,
				0.88);
		hullMaterial.specularColor =
			new Color3(
				0.3,
				0.3,
				0.3);

		fuselage.material = hullMaterial;
		fuselage.parent =
			this.shipRoot;

		this.shipMeshes.push(fuselage);

		const nose: Mesh =
			MeshBuilder.CreateCylinder(
				"nose",
				{
					diameterTop: 0,
					diameterBottom: 0.5,
					height: 1.2,
					tessellation: 8
				},
				scene);
		nose.rotation.x =
			Math.PI / 2;
		nose.position.z = 2;
		nose.material = hullMaterial;
		nose.parent =
			this.shipRoot;

		this.shipMeshes.push(nose);
	}

	/**
	 * Creates the four S-foil wings in attack position.
	 * @param {Scene} scene
	 * The scene to add wings to.
	 * @private
	 */
	private createWings(scene: Scene): void
	{
		const wingMaterial: StandardMaterial =
			new StandardMaterial(
				"wingMaterial",
				scene);
		wingMaterial.diffuseColor =
			new Color3(
				0.7,
				0.7,
				0.75);

		const wingConfig: { name: string; posX: number; posY: number; rotZ: number; }[] =
			[
				{ name: "wingTopLeft", posX: -1.5, posY: 0.5, rotZ: 0.2 },
				{ name: "wingTopRight", posX: 1.5, posY: 0.5, rotZ: -0.2 },
				{ name: "wingBottomLeft", posX: -1.5, posY: -0.5, rotZ: -0.2 },
				{ name: "wingBottomRight", posX: 1.5, posY: -0.5, rotZ: 0.2 }
			];

		for (const config of wingConfig)
		{
			const wing: Mesh =
				MeshBuilder.CreateBox(
					config.name,
					{
						width: 2.5,
						height: 0.08,
						depth: 1.5
					},
					scene);

			wing.position =
				new Vector3(
					config.posX,
					config.posY,
					-0.3);
			wing.rotation.z =
				config.rotZ;
			wing.material = wingMaterial;
			wing.parent =
				this.shipRoot;

			this.shipMeshes.push(wing);
		}
	}

	/**
	 * Creates four engine nacelles at the wing tips.
	 * @param {Scene} scene
	 * The scene to add nacelles to.
	 * @private
	 */
	private createEngineNacelles(scene: Scene): void
	{
		const engineMaterial: StandardMaterial =
			this.createEngineMaterial(scene);

		const nacellePositions: Vector3[] =
			this.getNacellePositions();

		for (let idx: number = 0; idx < nacellePositions.length; idx++)
		{
			const nacelle: Mesh =
				MeshBuilder.CreateCylinder(
					`nacelle_${idx}`,
					{
						diameter: 0.25,
						height: 1.2,
						tessellation: 8
					},
					scene);

			nacelle.rotation.x =
				Math.PI / 2;
			nacelle.position =
				nacellePositions[idx];
			nacelle.material = engineMaterial;
			nacelle.parent =
				this.shipRoot;

			this.shipMeshes.push(nacelle);
		}
	}

	/**
	 * Creates the emissive material for engine nacelles.
	 * @param {Scene} scene
	 * The scene to create the material in.
	 * @returns {StandardMaterial}
	 * The configured engine material.
	 * @private
	 */
	private createEngineMaterial(scene: Scene): StandardMaterial
	{
		const engineMaterial: StandardMaterial =
			new StandardMaterial(
				"engineMaterial",
				scene);
		engineMaterial.diffuseColor =
			new Color3(
				0.3,
				0.3,
				0.4);
		engineMaterial.emissiveColor =
			new Color3(
				0.2,
				0.4,
				0.8);
		return engineMaterial;
	}

	/**
	 * Returns the four wing-tip nacelle positions.
	 * @returns {Vector3[]}
	 * Array of nacelle positions.
	 * @private
	 */
	private getNacellePositions(): Vector3[]
	{
		return [
			new Vector3(
				-2.7,
				0.5,
				-0.3),
			new Vector3(
				2.7,
				0.5,
				-0.3),
			new Vector3(
				-2.7,
				-0.5,
				-0.3),
			new Vector3(
				2.7,
				-0.5,
				-0.3)
		];
	}

	/**
	 * Creates the cockpit hemisphere on top of the fuselage.
	 * @param {Scene} scene
	 * The scene to add the cockpit to.
	 * @private
	 */
	private createCockpit(scene: Scene): void
	{
		const cockpit: Mesh =
			MeshBuilder.CreateSphere(
				"cockpit",
				{
					diameter: 0.5,
					segments: 8,
					slice: 0.5
				},
				scene);

		const cockpitMaterial: StandardMaterial =
			new StandardMaterial(
				"cockpitMaterial",
				scene);
		cockpitMaterial.diffuseColor =
			new Color3(
				0.3,
				0.5,
				0.7);
		cockpitMaterial.alpha = 0.6;

		cockpit.position =
			new Vector3(
				0,
				0.35,
				0.8);
		cockpit.material = cockpitMaterial;
		cockpit.parent =
			this.shipRoot;

		this.shipMeshes.push(cockpit);
	}
}