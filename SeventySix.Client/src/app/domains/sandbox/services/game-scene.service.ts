/**
 * Game Scene Service.
 * Sets up the 3D space environment including starfield, lighting, and camera.
 * Domain-scoped service — must be provided via route providers array.
 */

import { Injectable } from "@angular/core";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/boxBuilder";

/**
 * Service responsible for setting up the 3D space environment.
 * Creates starfield, lighting, and camera for the game scene.
 */
@Injectable()
export class GameSceneService
{
	/**
	 * The camera used for the third-person view.
	 * @type {FreeCamera | null}
	 * @private
	 */
	private camera: FreeCamera | null = null;

	/**
	 * Array of starfield mesh instances for cleanup.
	 * @type {Mesh[]}
	 * @private
	 */
	private starMeshes: Mesh[] = [];

	/**
	 * Sets up the complete space environment with lighting, camera, and starfield.
	 * @param {Scene} scene
	 * The Babylon.js scene to configure.
	 */
	setupEnvironment(scene: Scene): void
	{
		scene.clearColor =
			new Color4(
				0,
				0,
				0.03,
				1);

		this.setupLighting(scene);
		this.setupCamera(scene);
		this.createStarfield(scene);
	}

	/**
	 * Returns the active camera instance.
	 * @returns {FreeCamera | null}
	 * The third-person camera or null if not initialized.
	 */
	getCamera(): FreeCamera | null
	{
		return this.camera;
	}

	/**
	 * Updates the camera to follow a target position.
	 * @param {Vector3} targetPosition
	 * The position to follow (typically the player ship).
	 * @param {number} deltaTime
	 * Time since last frame in seconds for smooth interpolation.
	 */
	updateCameraFollow(
		targetPosition: Vector3,
		deltaTime: number): void
	{
		if (this.camera === null)
		{
			return;
		}

		const cameraOffset: Vector3 =
			new Vector3(
				0,
				5,
				-12);

		const targetCameraPosition: Vector3 =
			targetPosition.add(cameraOffset);

		const lerpFactor: number =
			Math.min(
				1,
				deltaTime * 3);

		this.camera.position =
			Vector3.Lerp(
				this.camera.position,
				targetCameraPosition,
				lerpFactor);

		this.camera.setTarget(targetPosition);
	}

	/**
	 * Disposes all scene environment resources.
	 */
	dispose(): void
	{
		for (const mesh of this.starMeshes)
		{
			mesh.dispose();
		}

		this.starMeshes = [];
		this.camera = null;
	}

	/**
	 * Creates ambient and directional lighting for the space scene.
	 * @param {Scene} scene
	 * The scene to add lights to.
	 * @private
	 */
	private setupLighting(scene: Scene): void
	{
		const ambientLight: HemisphericLight =
			new HemisphericLight(
				"ambientLight",
				new Vector3(
					0,
					1,
					0),
				scene);
		ambientLight.intensity = 0.3;
		ambientLight.diffuse =
			new Color3(
				0.6,
				0.6,
				0.8);
		ambientLight.groundColor =
			new Color3(
				0.1,
				0.1,
				0.2);

		const directionalLight: DirectionalLight =
			new DirectionalLight(
				"sunLight",
				new Vector3(
					-1,
					-2,
					1)
					.normalize(),
				scene);
		directionalLight.intensity = 0.7;
		directionalLight.diffuse =
			new Color3(
				1,
				0.95,
				0.8);
	}

	/**
	 * Creates a free camera positioned for third-person view.
	 * @param {Scene} scene
	 * The scene to attach the camera to.
	 * @private
	 */
	private setupCamera(scene: Scene): void
	{
		this.camera =
			new FreeCamera(
				"gameCamera",
				new Vector3(
					0,
					5,
					-12),
				scene);

		this.camera.setTarget(Vector3.Zero());
		this.camera.inputs.clear();
		scene.activeCamera =
			this.camera;
	}

	/**
	 * Creates a starfield background using small sphere meshes.
	 * @param {Scene} scene
	 * The scene to add stars to.
	 * @private
	 */
	private createStarfield(scene: Scene): void
	{
		const starCount: number = 200;
		const starMaterial: StandardMaterial =
			new StandardMaterial(
				"starMaterial",
				scene);
		starMaterial.emissiveColor =
			new Color3(
				1,
				1,
				1);
		starMaterial.disableLighting = true;

		for (let idx: number = 0; idx < starCount; idx++)
		{
			const star: Mesh =
				MeshBuilder.CreateSphere(
					`star_${idx}`,
					{
						diameter: 0.05 + Math.random() * 0.1,
						segments: 4
					},
					scene);

			star.position =
				new Vector3(
					(Math.random() - 0.5) * 200,
					(Math.random() - 0.5) * 200,
					Math.random() * 200 + 20);

			star.material = starMaterial;

			this.starMeshes.push(star);
		}
	}
}