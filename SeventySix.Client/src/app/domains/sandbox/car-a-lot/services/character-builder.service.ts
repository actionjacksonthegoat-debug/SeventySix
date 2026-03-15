/**
 * Character Builder Service.
 * Constructs LEGO-style Princess and Prince characters for the kart.
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
import { CharacterType } from "@sandbox/car-a-lot/models/car-a-lot.models";

// ─── Character Dimensions ──────────────────────────────────────────

/** LEGO skin color (warm yellow). */
const SKIN_COLOR: Color3 =
	new Color3(0.95, 0.78, 0.6);

/** Auburn brown hair color for Princess. */
const AUBURN_HAIR_COLOR: Color3 =
	new Color3(0.55, 0.25, 0.1);

/** Princess torso yellow. */
const PRINCESS_TORSO_COLOR: Color3 =
	new Color3(0.95, 0.85, 0.2);

/** Royal blue for Prince torso and cape. */
const PRINCE_BLUE_COLOR: Color3 =
	new Color3(0.15, 0.25, 0.65);

/** Gold color for crown and prince cape stars. */
const GOLD_COLOR: Color3 =
	new Color3(0.9, 0.8, 0.3);

/** Brown hat color for Prince. */
const PRINCE_HAT_COLOR: Color3 =
	new Color3(0.4, 0.25, 0.15);

/** Red feather color. */
const FEATHER_COLOR: Color3 =
	new Color3(0.9, 0.3, 0.2);

/** Blue star color for Princess cape. */
const BLUE_STAR_COLOR: Color3 =
	new Color3(0.2, 0.3, 0.8);

/** Eye black color. */
const EYE_COLOR: Color3 =
	new Color3(0.05, 0.05, 0.05);

/**
 * Builds and manages LEGO-style characters for the kart.
 */
@Injectable()
export class CharacterBuilderService
{
	private scene: Scene | null = null;
	private kartRoot: TransformNode | null = null;
	private charRoot: TransformNode | null = null;
	private rescueRoot: TransformNode | null = null;
	private currentType: CharacterType =
		CharacterType.Princess;
	private readonly disposables: Array<{ dispose(): void; }> = [];
	private capeMesh: Mesh | null = null;

	/**
	 * Creates the default character and attaches to kart.
	 * @param scene - Babylon.js scene for mesh creation.
	 * @param kartRoot - Kart root node to parent the character to.
	 * @returns The character root TransformNode.
	 */
	createCharacter(
		scene: Scene,
		kartRoot: TransformNode): TransformNode
	{
		this.scene = scene;
		this.kartRoot = kartRoot;

		return this.buildCharacter(
			this.currentType,
			true);
	}

	/**
	 * Switches between Princess and Prince characters.
	 * @param type - The CharacterType to switch to.
	 */
	setCharacterType(type: CharacterType): void
	{
		if (this.scene == null || this.kartRoot == null)
		{
			return;
		}

		this.disposeCharacter();
		this.currentType = type;
		this.buildCharacter(type, true);
	}

	/**
	 * Creates a standing rescue character (opposite type from current).
	 * @param scene - Babylon.js scene for mesh creation.
	 * @returns The rescue character root TransformNode.
	 */
	createRescueCharacter(scene: Scene): TransformNode
	{
		const rescueType: CharacterType =
			this.currentType === CharacterType.Princess
				? CharacterType.Prince
				: CharacterType.Princess;

		const root: TransformNode =
			new TransformNode("char-rescue-root", scene);

		this.rescueRoot = root;

		this.buildCharacterMeshes(
			scene,
			root,
			rescueType,
			false);

		return root;
	}

	/**
	 * Animates cape flutter based on driving speed.
	 * @param speedMph - Current speed in miles per hour.
	 * @param deltaTime - Frame delta time in seconds.
	 */
	updateCapeAnimation(
		speedMph: number,
		deltaTime: number): void
	{
		if (this.capeMesh == null)
		{
			return;
		}

		const flutter: number =
			Math.sin(performance.now() * 0.005) * speedMph * 0.002;

		this.capeMesh.rotation.x =
			-0.26 + flutter * deltaTime * 10;
	}

	/**
	 * Disposes all character meshes and materials.
	 */
	dispose(): void
	{
		this.disposeCharacter();
		this.disposeRescue();
		this.scene = null;
		this.kartRoot = null;
	}

	/**
	 * Builds a character of the given type.
	 * @param type - Princess or Prince.
	 * @param seated - Whether the character is in seated pose.
	 * @returns The character root TransformNode.
	 */
	private buildCharacter(
		type: CharacterType,
		seated: boolean): TransformNode
	{
		const root: TransformNode =
			new TransformNode("char-root", this.scene!);

		root.parent =
			this.kartRoot;
		root.position =
			new Vector3(0, 1.2, -0.3);

		this.charRoot = root;

		this.buildCharacterMeshes(
			this.scene!,
			root,
			type,
			seated);

		return root;
	}

	/**
	 * Builds all meshes for a character with the given type and pose.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent TransformNode.
	 * @param type - Princess or Prince.
	 * @param seated - Whether in seated or standing pose.
	 */
	private buildCharacterMeshes(
		scene: Scene,
		root: TransformNode,
		type: CharacterType,
		seated: boolean): void
	{
		const isPrincess: boolean =
			type === CharacterType.Princess;
		const torsoColor: Color3 =
			isPrincess ? PRINCESS_TORSO_COLOR : PRINCE_BLUE_COLOR;

		this.createHead(scene, root);
		this.createEyes(scene, root);
		this.createTorso(scene, root, torsoColor, isPrincess);
		this.createArms(scene, root, torsoColor);
		this.createLegs(scene, root, torsoColor, seated);
		this.createCape(scene, root, isPrincess);

		if (isPrincess)
		{
			this.createPrincessHair(scene, root);
			this.createCrown(scene, root);
		}
		else
		{
			this.createPrinceHat(scene, root);
		}
	}

	/**
	 * Creates the LEGO cylindrical head.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 */
	private createHead(
		scene: Scene,
		root: TransformNode): void
	{
		const skinMat: StandardMaterial =
			this.createMaterial("char-skin-mat", SKIN_COLOR, scene);

		const head: Mesh =
			CreateCylinder(
				"char-head",
				{
					diameter: 1.2,
					height: 0.9,
					tessellation: 16
				},
				scene);

		head.position.y = 1.6;
		head.material = skinMat;
		head.parent = root;
		this.disposables.push(head);

		const headTop: Mesh =
			CreateSphere(
				"char-head-top",
				{
					diameter: 1.2,
					segments: 8,
					slice: 0.5
				},
				scene);

		headTop.position.y = 2.05;
		headTop.material = skinMat;
		headTop.parent = root;
		this.disposables.push(headTop);
	}

	/**
	 * Creates simple dot eyes on the head.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 */
	private createEyes(
		scene: Scene,
		root: TransformNode): void
	{
		const eyeMat: StandardMaterial =
			this.createMaterial("char-eye-mat", EYE_COLOR, scene);

		const leftEye: Mesh =
			CreateSphere(
				"char-eye-left",
				{ diameter: 0.12, segments: 6 },
				scene);

		leftEye.position =
			new Vector3(-0.25, 1.7, 0.55);
		leftEye.material = eyeMat;
		leftEye.parent = root;
		this.disposables.push(leftEye);

		const rightEye: Mesh =
			CreateSphere(
				"char-eye-right",
				{ diameter: 0.12, segments: 6 },
				scene);

		rightEye.position =
			new Vector3(0.25, 1.7, 0.55);
		rightEye.material = eyeMat;
		rightEye.parent = root;
		this.disposables.push(rightEye);
	}

	/**
	 * Creates the rectangular LEGO torso.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 * @param color - Torso color.
	 * @param isPrincess - Whether the character is Princess.
	 */
	private createTorso(
		scene: Scene,
		root: TransformNode,
		color: Color3,
		isPrincess: boolean): void
	{
		const torsoMat: StandardMaterial =
			this.createMaterial("char-torso-mat", color, scene);
		const torsoWidth: number =
			isPrincess ? 1.2 : 1.4;

		const torso: Mesh =
			CreateBox(
				"char-torso",
				{
					width: torsoWidth,
					height: 1.0,
					depth: 0.6
				},
				scene);

		torso.position.y = 0.8;
		torso.material = torsoMat;
		torso.parent = root;
		this.disposables.push(torso);
	}

	/**
	 * Creates two arms with C-shaped hand grips.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 * @param color - Arm color matching torso.
	 */
	private createArms(
		scene: Scene,
		root: TransformNode,
		color: Color3): void
	{
		const armMat: StandardMaterial =
			this.createMaterial("char-arm-mat", color, scene);
		const handMat: StandardMaterial =
			this.createMaterial("char-hand-mat", SKIN_COLOR, scene);
		const sides: number[] =
			[-1, 1];

		for (const side of sides)
		{
			const suffix: string =
				side === -1 ? "left" : "right";

			const arm: Mesh =
				CreateCylinder(
					`char-arm-${suffix}`,
					{
						diameter: 0.25,
						height: 0.8,
						tessellation: 8
					},
					scene);

			arm.position =
				new Vector3(side * 0.8, 0.6, 0.15);
			arm.rotation.x = -0.4;
			arm.material = armMat;
			arm.parent = root;
			this.disposables.push(arm);

			const hand: Mesh =
				CreateCylinder(
					`char-hand-${suffix}`,
					{
						diameter: 0.2,
						height: 0.15,
						tessellation: 8
					},
					scene);

			hand.position =
				new Vector3(side * 0.8, 0.15, 0.35);
			hand.material = handMat;
			hand.parent = root;
			this.disposables.push(hand);
		}
	}

	/**
	 * Creates LEGO-style legs.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 * @param color - Leg color.
	 * @param seated - Whether legs are in seated (bent) pose.
	 */
	private createLegs(
		scene: Scene,
		root: TransformNode,
		color: Color3,
		seated: boolean): void
	{
		const legMat: StandardMaterial =
			this.createMaterial("char-leg-mat", color, scene);
		const legHeight: number =
			seated ? 0.5 : 0.9;

		for (const side of [-0.25, 0.25])
		{
			const leg: Mesh =
				CreateBox(
					`char-leg-${side < 0 ? "left" : "right"}`,
					{
						width: 0.5,
						height: legHeight,
						depth: 0.3
					},
					scene);

			leg.position =
				new Vector3(
					side,
					seated ? 0.05 : -0.15,
					seated ? 0.2 : 0);
			leg.material = legMat;
			leg.parent = root;
			this.disposables.push(leg);
		}
	}

	/**
	 * Creates the character cape.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 * @param isPrincess - Whether Princess or Prince style cape.
	 */
	private createCape(
		scene: Scene,
		root: TransformNode,
		isPrincess: boolean): void
	{
		const capeColor: Color3 =
			isPrincess ? PRINCESS_TORSO_COLOR : PRINCE_BLUE_COLOR;
		const capeMat: StandardMaterial =
			this.createMaterial("char-cape-mat", capeColor, scene);

		const cape: Mesh =
			CreateBox(
				"char-cape",
				{
					width: 1.4,
					height: 1.6,
					depth: 0.05
				},
				scene);

		cape.position =
			new Vector3(0, 0.6, -0.35);
		cape.rotation.x = -0.26;
		cape.material = capeMat;
		cape.parent = root;
		this.capeMesh = cape;
		this.disposables.push(cape);

		this.createCapeStars(
			scene,
			cape,
			isPrincess);
	}

	/**
	 * Creates star decorations on the cape.
	 * @param scene - Babylon.js scene.
	 * @param cape - Cape mesh to parent stars to.
	 * @param isPrincess - Whether to use blue or gold stars.
	 */
	private createCapeStars(
		scene: Scene,
		cape: Mesh,
		isPrincess: boolean): void
	{
		const starColor: Color3 =
			isPrincess ? BLUE_STAR_COLOR : GOLD_COLOR;
		const starMat: StandardMaterial =
			this.createMaterial("char-star-mat", starColor, scene);
		starMat.emissiveColor =
			starColor.scale(0.3);

		const starPositions: Vector3[] =
			[
				new Vector3(-0.35, 0.4, 0.03),
				new Vector3(0.3, 0.5, 0.03),
				new Vector3(-0.15, -0.1, 0.03),
				new Vector3(0.4, -0.2, 0.03),
				new Vector3(-0.4, -0.5, 0.03)
			];

		for (let idx: number = 0; idx < starPositions.length; idx++)
		{
			const star: Mesh =
				CreateSphere(
					`char-cape-star-${idx}`,
					{ diameter: 0.12, segments: 4 },
					scene);

			star.position =
				starPositions[idx];
			star.material = starMat;
			star.parent = cape;
			this.disposables.push(star);
		}
	}

	/**
	 * Creates Princess flowing auburn hair.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 */
	private createPrincessHair(
		scene: Scene,
		root: TransformNode): void
	{
		const hairMat: StandardMaterial =
			this.createMaterial(
				"char-princess-hair-mat",
				AUBURN_HAIR_COLOR,
				scene);

		const hairTop: Mesh =
			CreateSphere(
				"char-hair-princess",
				{
					diameter: 1.35,
					segments: 8
				},
				scene);

		hairTop.position.y = 2.1;
		hairTop.scaling =
			new Vector3(1, 0.5, 1);
		hairTop.material = hairMat;
		hairTop.parent = root;
		this.disposables.push(hairTop);

		for (const side of [-0.45, 0.45])
		{
			const sideHair: Mesh =
				CreateCylinder(
					`char-hair-side-${side < 0 ? "left" : "right"}`,
					{
						diameter: 0.35,
						height: 1.2,
						tessellation: 8
					},
					scene);

			sideHair.position =
				new Vector3(side, 1.2, -0.15);
			sideHair.material = hairMat;
			sideHair.parent = root;
			this.disposables.push(sideHair);
		}
	}

	/**
	 * Creates Princess golden crown/tiara.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 */
	private createCrown(
		scene: Scene,
		root: TransformNode): void
	{
		const crownMat: StandardMaterial =
			this.createMaterial("char-crown-mat", GOLD_COLOR, scene);

		const crown: Mesh =
			CreateCylinder(
				"char-crown",
				{
					diameter: 0.8,
					height: 0.15,
					tessellation: 12
				},
				scene);

		crown.position.y = 2.35;
		crown.material = crownMat;
		crown.parent = root;
		this.disposables.push(crown);
	}

	/**
	 * Creates Prince feather hat.
	 * @param scene - Babylon.js scene.
	 * @param root - Parent node.
	 */
	private createPrinceHat(
		scene: Scene,
		root: TransformNode): void
	{
		const hatMat: StandardMaterial =
			this.createMaterial("char-hat-mat", PRINCE_HAT_COLOR, scene);

		const hat: Mesh =
			CreateCylinder(
				"char-hat-prince",
				{
					diameter: 1.3,
					height: 0.4,
					tessellation: 12
				},
				scene);

		hat.position.y = 2.2;
		hat.material = hatMat;
		hat.parent = root;
		this.disposables.push(hat);

		const featherMat: StandardMaterial =
			this.createMaterial("char-feather-mat", FEATHER_COLOR, scene);

		const feather: Mesh =
			CreateSphere(
				"char-feather",
				{
					diameter: 0.2,
					segments: 6
				},
				scene);

		feather.scaling =
			new Vector3(0.5, 0.5, 2.5);
		feather.position =
			new Vector3(0.3, 2.5, -0.2);
		feather.rotation.x = -0.78;
		feather.material = featherMat;
		feather.parent = root;
		this.disposables.push(feather);
	}

	/**
	 * Creates a StandardMaterial with the given color.
	 * @param name - Material name.
	 * @param color - Diffuse color.
	 * @param scene - Babylon.js scene.
	 * @returns The created StandardMaterial.
	 */
	private createMaterial(
		name: string,
		color: Color3,
		scene: Scene): StandardMaterial
	{
		const mat: StandardMaterial =
			new StandardMaterial(name, scene);

		mat.diffuseColor = color;
		this.disposables.push(mat);

		return mat;
	}

	/**
	 * Disposes the current character meshes without clearing scene/kart references.
	 */
	private disposeCharacter(): void
	{
		for (const item of this.disposables)
		{
			item.dispose();
		}

		this.disposables.length = 0;
		this.capeMesh = null;

		if (this.charRoot != null)
		{
			this.charRoot.dispose();
			this.charRoot = null;
		}
	}

	/**
	 * Disposes the rescue character if present.
	 */
	private disposeRescue(): void
	{
		if (this.rescueRoot != null)
		{
			this.rescueRoot.dispose();
			this.rescueRoot = null;
		}
	}
}