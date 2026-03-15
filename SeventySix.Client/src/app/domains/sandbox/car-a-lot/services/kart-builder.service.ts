/**
 * Kart Builder Service.
 * Constructs the bubbly 50s-style kart mesh hierarchy with color selection.
 */

import { Injectable } from "@angular/core";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import {
	KART_COLOR_PINK,
	KART_COLOR_RED,
	KART_COLOR_TEAL_BLUE
} from "@sandbox/car-a-lot/constants/car-a-lot.constants";
import { KartColor } from "@sandbox/car-a-lot/models/car-a-lot.models";

/** Wheel radius in world units. */
const WHEEL_RADIUS: number = 0.3;

/** Wheel width in world units (3x wide). */
const WHEEL_WIDTH: number = 0.45;

/** Body scale X (width). */
const BODY_SCALE_X: number = 2.5;

/** Body scale Y (height — tall rounded shape). */
const BODY_SCALE_Y: number = 1.8;

/** Body scale Z (length). */
const BODY_SCALE_Z: number = 4.0;

/** Maps KartColor enum to Color3 values. */
const KART_COLOR_MAP: ReadonlyMap<KartColor, Color3> =
	new Map<KartColor, Color3>(
		[
			[KartColor.Pink, KART_COLOR_PINK],
			[KartColor.Red, KART_COLOR_RED],
			[KartColor.TealBlue, KART_COLOR_TEAL_BLUE]
		]);

/**
 * Builds and manages the player kart mesh hierarchy.
 */
@Injectable()
export class KartBuilderService
{
	private root: TransformNode | null = null;
	private bodyMaterial: StandardMaterial | null = null;
	private wheelMaterial: StandardMaterial | null = null;
	private chromeMaterial: StandardMaterial | null = null;
	private readonly disposables: Array<{ dispose(): void; }> = [];

	/**
	 * Creates the full kart mesh hierarchy in the given scene.
	 * @param scene - Babylon.js scene to build the kart in.
	 * @returns The root TransformNode of the kart hierarchy.
	 */
	createKart(scene: Scene): TransformNode
	{
		this.root =
			new TransformNode("kart-root", scene);

		this.createMaterials(scene);
		this.createBody(scene);
		this.createSeat(scene);
		this.createWheels(scene);
		this.createBumpers(scene);

		return this.root;
	}

	/**
	 * Changes the kart body color at runtime.
	 * @param color - The KartColor to apply.
	 */
	setKartColor(color: KartColor): void
	{
		if (this.bodyMaterial == null)
		{
			return;
		}

		const colorValue: Color3 | undefined =
			KART_COLOR_MAP.get(color);

		if (colorValue != null)
		{
			this.bodyMaterial.diffuseColor = colorValue;
		}
	}

	/**
	 * Returns the approximate kart width for collision purposes.
	 * @returns The kart width in world units.
	 */
	getKartWidth(): number
	{
		return BODY_SCALE_X;
	}

	/**
	 * Rotates wheels based on current speed.
	 * @param speedMph - Current speed in miles per hour.
	 * @param deltaTime - Frame delta time in seconds.
	 */
	updateWheels(
		speedMph: number,
		deltaTime: number): void
	{
		if (this.root == null)
		{
			return;
		}

		const rotationAmount: number =
			speedMph * deltaTime * 0.1;

		for (const child of this.root.getChildren())
		{
			if (child.name.startsWith("kart-wheel"))
			{
				(child as Mesh).rotation.x += rotationAmount;
			}
		}
	}

	/**
	 * Disposes all kart meshes, materials, and the root node.
	 */
	dispose(): void
	{
		for (const item of this.disposables)
		{
			item.dispose();
		}

		this.disposables.length = 0;

		if (this.root != null)
		{
			this.root.dispose();
			this.root = null;
		}

		this.bodyMaterial = null;
		this.wheelMaterial = null;
		this.chromeMaterial = null;
	}

	/**
	 * Creates the three shared materials for body, wheels, and chrome.
	 * @param scene - Babylon.js scene for material creation.
	 */
	private createMaterials(scene: Scene): void
	{
		this.bodyMaterial =
			new StandardMaterial("kart-body-mat", scene);
		this.bodyMaterial.diffuseColor = KART_COLOR_PINK;
		this.bodyMaterial.specularColor =
			new Color3(0.4, 0.4, 0.4);
		this.disposables.push(this.bodyMaterial);

		this.wheelMaterial =
			new StandardMaterial("kart-wheel-mat", scene);
		this.wheelMaterial.diffuseColor =
			new Color3(0.1, 0.1, 0.1);
		this.wheelMaterial.specularColor =
			new Color3(0.2, 0.2, 0.2);
		this.disposables.push(this.wheelMaterial);

		this.chromeMaterial =
			new StandardMaterial("kart-chrome-mat", scene);
		this.chromeMaterial.diffuseColor =
			new Color3(0.8, 0.8, 0.85);
		this.chromeMaterial.specularColor =
			new Color3(0.9, 0.9, 0.9);
		this.disposables.push(this.chromeMaterial);
	}

	/**
	 * Creates the bubbly body sphere with hood.
	 * @param scene - Babylon.js scene for mesh creation.
	 */
	private createBody(scene: Scene): void
	{
		const body: Mesh =
			CreateSphere(
				"kart-body",
				{ segments: 12 },
				scene);

		body.scaling =
			new Vector3(
				BODY_SCALE_X,
				BODY_SCALE_Y,
				BODY_SCALE_Z);
		body.position.y = 0.5;
		body.material =
			this.bodyMaterial;
		body.parent =
			this.root;
		this.disposables.push(body);

		const hood: Mesh =
			CreateSphere(
				"kart-hood",
				{ segments: 8 },
				scene);

		hood.scaling =
			new Vector3(1.8, 0.5, 1.5);
		hood.position =
			new Vector3(0, 0.7, 1.5);
		hood.material =
			this.bodyMaterial;
		hood.parent =
			this.root;
		this.disposables.push(hood);
	}

	/**
	 * Creates the driver seat mesh.
	 * @param scene - Babylon.js scene for mesh creation.
	 */
	private createSeat(scene: Scene): void
	{
		const seat: Mesh =
			CreateBox(
				"kart-seat",
				{
					width: 1.0,
					height: 0.4,
					depth: 0.8
				},
				scene);

		seat.position =
			new Vector3(0, 1.0, -0.3);
		seat.material =
			this.chromeMaterial;
		seat.parent =
			this.root;
		this.disposables.push(seat);
	}

	/**
	 * Creates four wheel cylinders at the kart corners.
	 * @param scene - Babylon.js scene for mesh creation.
	 */
	private createWheels(scene: Scene): void
	{
		const wheelPositions: Array<[string, Vector3]> =
			[
				[
					"kart-wheel-fl",
					new Vector3(-1.3, 0, 1.4)
				],
				[
					"kart-wheel-fr",
					new Vector3(1.3, 0, 1.4)
				],
				[
					"kart-wheel-rl",
					new Vector3(-1.3, 0, -1.4)
				],
				[
					"kart-wheel-rr",
					new Vector3(1.3, 0, -1.4)
				]
			];

		for (const [name, position] of wheelPositions)
		{
			const wheel: Mesh =
				CreateCylinder(
					name,
					{
						diameter: WHEEL_RADIUS * 2,
						height: WHEEL_WIDTH,
						tessellation: 16
					},
					scene);

			wheel.rotation.z =
				Math.PI / 2;
			wheel.position = position;
			wheel.material =
				this.wheelMaterial;
			wheel.parent =
				this.root;
			this.disposables.push(wheel);
		}
	}

	/**
	 * Creates front and rear chrome bumper meshes.
	 * @param scene - Babylon.js scene for mesh creation.
	 */
	private createBumpers(scene: Scene): void
	{
		const frontBumper: Mesh =
			CreateBox(
				"kart-bumper-front",
				{
					width: 2.2,
					height: 0.3,
					depth: 0.2
				},
				scene);

		frontBumper.position =
			new Vector3(0, 0.2, 2.1);
		frontBumper.material =
			this.chromeMaterial;
		frontBumper.parent =
			this.root;
		this.disposables.push(frontBumper);

		const rearBumper: Mesh =
			CreateBox(
				"kart-bumper-rear",
				{
					width: 2.2,
					height: 0.3,
					depth: 0.2
				},
				scene);

		rearBumper.position =
			new Vector3(0, 0.2, -2.1);
		rearBumper.material =
			this.chromeMaterial;
		rearBumper.parent =
			this.root;
		this.disposables.push(rearBumper);
	}
}